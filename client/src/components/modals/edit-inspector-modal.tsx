import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Inspector } from "@/lib/types";

interface EditInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  inspector: Inspector | null;
}

export default function EditInspectorModal({ isOpen, onClose, inspector }: EditInspectorModalProps) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");
  const [active, setActive] = useState(true);
  const [language, setLanguage] = useState("en");

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Reset form when inspector changes or modal opens
  useEffect(() => {
    if (inspector) {
      setName(inspector.user.name);
      setUsername(inspector.user.username);
      setPassword(inspector.user.password);
      setBio(inspector.bio || "");
      setActive(inspector.active);
      setLanguage(inspector.language);
    }
  }, [inspector]);

  const updateInspectorMutation = useMutation({
    mutationFn: async () => {
      if (!inspector) throw new Error("No inspector selected");

      // Update user details first
      const userRes = await apiRequest("PATCH", `/api/users/${inspector.user.id}`, {
        name,
        username,
        password,
      });

      // Update inspector details
      const inspectorRes = await apiRequest("PATCH", `/api/inspectors/${inspector.id}`, {
        bio,
        active,
        language,
      });

      return { user: await userRes.json(), inspector: await inspectorRes.json() };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inspectors"] });
      toast({
        title: "Success",
        description: "Inspector updated successfully",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update inspector",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !username.trim() || !password.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    updateInspectorMutation.mutate();
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Edit Inspector</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">User Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="johndoe"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
            </div>
          </div>

          {/* Inspector Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Inspector Information</h3>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Brief description about the inspector..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 pt-7">
                <Switch
                  id="active"
                  checked={active}
                  onCheckedChange={setActive}
                />
                <Label htmlFor="active">Active Status</Label>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={updateInspectorMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateInspectorMutation.isPending}
            >
              {updateInspectorMutation.isPending ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Updating...</span>
                </div>
              ) : (
                "Update Inspector"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}