import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, MapPin, User, Calendar, FileText, Upload, Eye, Users, Smartphone } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { RunlistUpload } from "@/components/runlist-upload";

export default function SimpleDashboard() {
  const { toast } = useToast();
  const [selectedAuction, setSelectedAuction] = useState<string>("");
  const [selectedInspector, setSelectedInspector] = useState<string>("");
  const [showRunlistUpload, setShowRunlistUpload] = useState(false);

  // Fetch data
  const { data: auctions = [] } = useQuery({
    queryKey: ["/api/auctions"],
  });

  const { data: inspectors = [] } = useQuery({
    queryKey: ["/api/inspectors"],
  });

  const { data: runlists = [] } = useQuery({
    queryKey: ["/api/runlists"],
  });

  const { data: inspections = [] } = useQuery({
    queryKey: ["/api/inspections"],
  });

  // Add auction mutation
  const addAuctionMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/auctions", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auctions"] });
      toast({ title: "Success", description: "Auction added successfully" });
    },
  });

  // Add inspector mutation
  const addInspectorMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/inspectors", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inspectors"] });
      toast({ title: "Success", description: "Inspector added successfully" });
    },
  });

  const handleAuctionSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    addAuctionMutation.mutate({
      name: formData.get("name"),
      location: formData.get("location"),
      address: formData.get("address"),
      description: formData.get("description"),
    });
  };

  const handleInspectorSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    addInspectorMutation.mutate({
      user_id: 1, // Default user for now
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      bio: formData.get("bio"),
    });
  };

  const filteredRunlists = runlists.filter((runlist: any) => {
    if (selectedAuction && selectedAuction !== "all" && runlist.auction_id !== parseInt(selectedAuction)) return false;
    if (selectedInspector && selectedInspector !== "all" && runlist.inspector_id !== parseInt(selectedInspector)) return false;
    return true;
  });

  const pendingInspections = inspections.filter((inspection: any) => 
    inspection.status === "pending" || inspection.status === "scheduled"
  ).length;

  const completedToday = inspections.filter((inspection: any) => {
    if (inspection.status !== "completed") return false;
    const today = new Date().toDateString();
    return new Date(inspection.completion_date).toDateString() === today;
  }).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">Inspection Management</h1>
          <p className="text-gray-600">Manage auctions, inspectors, and vehicle runlists</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Auctions</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{auctions.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inspectors</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inspectors.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Inspections</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingInspections}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedToday}</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Button onClick={() => setShowRunlistUpload(true)} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Upload Runlist
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/inspections'} className="w-full">
            <Eye className="h-4 w-4 mr-2" />
            View All Inspections
          </Button>
          <Button 
            variant="default" 
            onClick={() => window.location.href = '/inspector'} 
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <User className="h-4 w-4 mr-2" />
            Inspector Portal
          </Button>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="runlists" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="runlists">Runlists</TabsTrigger>
            <TabsTrigger value="auctions">Auctions</TabsTrigger>
            <TabsTrigger value="inspectors">Inspectors</TabsTrigger>
          </TabsList>

          {/* Runlists Tab */}
          <TabsContent value="runlists" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Vehicle Runlists</CardTitle>
                    <CardDescription>Manage inspection runlists for each auction</CardDescription>
                  </div>
                  <Button onClick={() => setShowRunlistUpload(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Runlist
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters */}
                <div className="flex gap-4">
                  <Select value={selectedAuction} onValueChange={setSelectedAuction}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="All Auctions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Auctions</SelectItem>
                      {auctions.map((auction: any) => (
                        <SelectItem key={auction.id} value={auction.id.toString()}>
                          {auction.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedInspector} onValueChange={setSelectedInspector}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="All Inspectors" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Inspectors</SelectItem>
                      {inspectors.map((inspector: any) => (
                        <SelectItem key={inspector.id} value={inspector.id.toString()}>
                          {inspector.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Runlists Grid */}
                <div className="grid gap-4">
                  {filteredRunlists.map((runlist: any) => (
                    <Card key={runlist.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <h3 className="font-semibold">{runlist.filename}</h3>
                            <div className="flex gap-4 text-sm text-gray-600">
                              <span>📍 {auctions.find((a: any) => a.id === runlist.auction_id)?.name}</span>
                              <span>👤 {inspectors.find((i: any) => i.id === runlist.inspector_id)?.name || "Unassigned"}</span>
                              <span>🚗 {runlist.total_vehicles} vehicles</span>
                              <span>📅 {new Date(runlist.inspection_date).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {filteredRunlists.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No runlists found matching the selected filters.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Auctions Tab */}
          <TabsContent value="auctions" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Auction Locations</CardTitle>
                    <CardDescription>Manage auction houses and locations</CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Auction
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Auction</DialogTitle>
                        <DialogDescription>Add a new auction location to the system</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleAuctionSubmit} className="space-y-4">
                        <div>
                          <Label htmlFor="name">Auction Name</Label>
                          <Input id="name" name="name" placeholder="e.g., Adesa Memphis" required />
                        </div>
                        <div>
                          <Label htmlFor="location">Location</Label>
                          <Input id="location" name="location" placeholder="e.g., Memphis, TN" required />
                        </div>
                        <div>
                          <Label htmlFor="address">Address</Label>
                          <Input id="address" name="address" placeholder="Full address" />
                        </div>
                        <div>
                          <Label htmlFor="description">Description</Label>
                          <Textarea id="description" name="description" placeholder="Additional details" />
                        </div>
                        <Button type="submit" className="w-full" disabled={addAuctionMutation.isPending}>
                          {addAuctionMutation.isPending ? "Adding..." : "Add Auction"}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {auctions.map((auction: any) => (
                    <Card key={auction.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{auction.name}</h3>
                            <p className="text-sm text-gray-600">{auction.location}</p>
                            {auction.address && (
                              <p className="text-xs text-gray-500">{auction.address}</p>
                            )}
                          </div>
                          <Badge variant="secondary">
                            {runlists.filter((r: any) => r.auction_id === auction.id).length} runlists
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inspectors Tab */}
          <TabsContent value="inspectors" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Inspectors</CardTitle>
                    <CardDescription>Manage inspection team members</CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Inspector
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Inspector</DialogTitle>
                        <DialogDescription>Add a new inspector to the team</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleInspectorSubmit} className="space-y-4">
                        <div>
                          <Label htmlFor="inspector-name">Name</Label>
                          <Input id="inspector-name" name="name" placeholder="Inspector name" required />
                        </div>
                        <div>
                          <Label htmlFor="inspector-email">Email</Label>
                          <Input id="inspector-email" name="email" type="email" placeholder="email@example.com" />
                        </div>
                        <div>
                          <Label htmlFor="inspector-phone">Phone</Label>
                          <Input id="inspector-phone" name="phone" placeholder="Phone number" />
                        </div>
                        <div>
                          <Label htmlFor="inspector-bio">Bio</Label>
                          <Textarea id="inspector-bio" name="bio" placeholder="Brief bio or specialization" />
                        </div>
                        <Button type="submit" className="w-full" disabled={addInspectorMutation.isPending}>
                          {addInspectorMutation.isPending ? "Adding..." : "Add Inspector"}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {inspectors.map((inspector: any) => (
                    <Card key={inspector.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{inspector.name}</h3>
                            {inspector.email && (
                              <p className="text-sm text-gray-600">{inspector.email}</p>
                            )}
                            {inspector.phone && (
                              <p className="text-xs text-gray-500">{inspector.phone}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={inspector.active ? "default" : "secondary"}>
                              {inspector.active ? "Active" : "Inactive"}
                            </Badge>
                            <Badge variant="outline">
                              {runlists.filter((r: any) => r.inspector_id === inspector.id).length} runlists
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Runlist Upload Dialog */}
        <RunlistUpload 
          open={showRunlistUpload} 
          onOpenChange={setShowRunlistUpload} 
        />
      </div>
    </div>
  );
}