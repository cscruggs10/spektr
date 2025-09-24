import { useState } from "react";
import { Helmet } from "react-helmet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Trash2, UserPlus, Shield, Mail } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AUTHORIZED_EMAILS } from "@/config/authorized-emails";
import { useAuth } from "@/contexts/auth-context";

export default function AccessManagement() {
  const [emails, setEmails] = useState<string[]>([...AUTHORIZED_EMAILS]);
  const [newEmail, setNewEmail] = useState("");
  const [emailToRemove, setEmailToRemove] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const { toast } = useToast();
  const { userEmail } = useAuth();

  // Check if current user is an admin (for now, only Corey)
  const isAdmin = userEmail === "corey@ifinancememphis.com";

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleAddEmail = () => {
    if (!validateEmail(newEmail)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    if (emails.includes(newEmail.toLowerCase())) {
      toast({
        title: "Email already exists",
        description: "This email is already authorized",
        variant: "destructive",
      });
      return;
    }

    // In a real app, this would make an API call to update the server
    const updatedEmails = [...emails, newEmail.toLowerCase()];
    setEmails(updatedEmails);

    // Update the config (in production, this would be server-side)
    AUTHORIZED_EMAILS.push(newEmail.toLowerCase());

    toast({
      title: "Email added",
      description: `${newEmail} has been granted access`,
    });

    setNewEmail("");
    setIsAddDialogOpen(false);
  };

  const handleRemoveEmail = () => {
    if (!emailToRemove) return;

    // Prevent removing your own email
    if (emailToRemove === userEmail) {
      toast({
        title: "Cannot remove your own access",
        description: "You cannot remove your own email address",
        variant: "destructive",
      });
      return;
    }

    // In a real app, this would make an API call to update the server
    const updatedEmails = emails.filter(e => e !== emailToRemove);
    setEmails(updatedEmails);

    // Update the config (in production, this would be server-side)
    const index = AUTHORIZED_EMAILS.indexOf(emailToRemove);
    if (index > -1) {
      AUTHORIZED_EMAILS.splice(index, 1);
    }

    toast({
      title: "Email removed",
      description: `${emailToRemove} access has been revoked`,
    });

    setEmailToRemove(null);
    setIsRemoveDialogOpen(false);
  };

  const openRemoveDialog = (email: string) => {
    setEmailToRemove(email);
    setIsRemoveDialogOpen(true);
  };

  return (
    <>
      <Helmet>
        <title>Access Management | Spektr</title>
        <link
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"
          rel="stylesheet"
        />
      </Helmet>

      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-semibold text-gray-900">Access Management</h1>
            </div>
            {isAdmin && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Email
              </Button>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Authorized Emails Card */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Mail className="h-5 w-5" />
                  <span>Authorized Email Addresses</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {emails.map((email) => (
                    <div
                      key={email}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Mail className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{email}</p>
                          {email === userEmail && (
                            <Badge variant="outline" className="mt-1">
                              Current User
                            </Badge>
                          )}
                          {email === "corey@ifinancememphis.com" && (
                            <Badge className="mt-1 bg-purple-100 text-purple-800">
                              Admin
                            </Badge>
                          )}
                        </div>
                      </div>
                      {isAdmin && email !== userEmail && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openRemoveDialog(email)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Security Note</p>
                      <p className="text-sm text-blue-700 mt-1">
                        Only authorized email addresses can access the dashboard. Contact an administrator
                        to request access for additional users.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistics Card */}
            <Card>
              <CardHeader>
                <CardTitle>Access Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Total Authorized Users</p>
                    <p className="text-2xl font-bold text-gray-900">{emails.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Admin Users</p>
                    <p className="text-2xl font-bold text-gray-900">1</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>About Access Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  This page allows administrators to manage who has access to the Spektr dashboard.
                  Users must authenticate with an authorized email address to access the system.
                </p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Add new authorized emails</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Remove access when needed</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Add Email Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Authorized Email</DialogTitle>
            <DialogDescription>
              Enter the email address you want to grant dashboard access to.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              type="email"
              placeholder="user@example.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddEmail();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddEmail}>Add Email</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Email Dialog */}
      <Dialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Access</DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke access for {emailToRemove}? They will no longer
              be able to log into the dashboard.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRemoveDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemoveEmail}>
              Remove Access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}