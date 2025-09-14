import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Auction } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Form schema
const formSchema = z.object({
  user_id: z.number().optional(),
  name: z.string().min(1, "Inspector name is required"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  auction_id: z.number({
    required_error: "Please select an auction",
  }),
  bio: z.string().optional(),
  active: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface AddInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddInspectorModal({ isOpen, onClose }: AddInspectorModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: auctions } = useQuery<Auction[]>({
    queryKey: ["/api/auctions"],
  });

  const createInspectorMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      // First create the user
      const userResponse = await apiRequest("POST", "/api/users", {
        name: values.name,
        username: values.username,
        password: values.password,
        role: "inspector"
      });
      
      if (!userResponse.ok) {
        const errorText = await userResponse.text();
        throw new Error(errorText || "Failed to create user");
      }
      
      const user = await userResponse.json();
      
      // Then create the inspector with the user ID
      const inspectorData = {
        user_id: user.id,
        auction_id: values.auction_id,
        bio: values.bio || "",
        active: values.active,
        rating: null
      };
      
      const inspectorResponse = await apiRequest("POST", "/api/inspectors", inspectorData);
      
      if (!inspectorResponse.ok) {
        const errorText = await inspectorResponse.text();
        throw new Error(errorText || "Failed to create inspector");
      }
      
      return inspectorResponse.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inspectors"] });
      toast({
        title: "Inspector created",
        description: "Inspector has been created successfully.",
      });
      form.reset();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create inspector",
        variant: "destructive",
      });
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      username: "",
      password: "",
      bio: "",
      active: true,
    },
  });

  const onSubmit = (values: FormValues) => {
    createInspectorMutation.mutate(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Inspector</DialogTitle>
          <DialogDescription>
            Create a new inspector profile. Inspectors are responsible for conducting vehicle inspections at auctions.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter username" {...field} />
                  </FormControl>
                  <FormDescription>
                    The inspector will use this username to log in
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter password" type="password" {...field} />
                  </FormControl>
                  <FormDescription>
                    Minimum 6 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="auction_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned Auction</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(parseInt(value))} 
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an auction" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {auctions?.map((auction) => (
                        <SelectItem key={auction.id} value={auction.id.toString()}>
                          {auction.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The auction where this inspector will be working
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Briefly describe the inspector's experience" 
                      {...field} 
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Active Status</FormLabel>
                    <FormDescription>
                      Enable to make this inspector available for work
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter className="pt-6 pb-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={createInspectorMutation.isPending}
                className="mr-2"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createInspectorMutation.isPending}
              >
                {createInspectorMutation.isPending ? "Creating..." : "Add Inspector"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}