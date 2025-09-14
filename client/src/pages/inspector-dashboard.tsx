import { useState } from "react";
import { Helmet } from "react-helmet";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Loader2, Filter, Check, X, FileText } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Inspection, Inspector, User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

function formatDateTime(date: string | Date | null) {
  if (!date) return "N/A";
  return format(new Date(date), "MMM d, yyyy h:mm a");
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "pending":
      return "bg-blue-100 text-blue-800";
    case "in_progress":
      return "bg-yellow-100 text-yellow-800";
    case "completed":
      return "bg-green-100 text-green-800";
    case "canceled": // Fixed spelling to match status enum
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export default function InspectorDashboard() {
  const [activeTab, setActiveTab] = useState("today");
  const [inspectorId, setInspectorId] = useState<string>("");
  const [filterVin, setFilterVin] = useState("");
  const [showOnlyPending, setShowOnlyPending] = useState(true);
  const { toast } = useToast();
  const [_, navigate] = useLocation();

  // Get inspectors from API
  const { data: inspectors = [], isLoading: loadingInspectors } = useQuery<Inspector[]>({
    queryKey: ["/api/inspectors"],
  });

  // Query inspections with filters based on selected inspector
  const { data: inspections = [], isLoading: loadingInspections } = useQuery<Inspection[]>({
    queryKey: ["/api/inspections", { inspectorId: inspectorId ? parseInt(inspectorId) : undefined }],
    enabled: !!inspectorId,
  });
  
  // Mutation for starting an inspection (changing status to in_progress)
  const startInspectionMutation = useMutation({
    mutationFn: async (inspectionId: number) => {
      try {
        const res = await apiRequest("PATCH", `/api/inspections/${inspectionId}`, {
          status: "in_progress",
          start_date: new Date().toISOString() // Convert to ISO string format for proper date handling
        });
        return await res.json();
      } catch (error) {
        console.error("Start inspection error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      // Invalidate the inspections query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/inspections"] });
      toast({
        title: "Inspection started",
        description: "The inspection has been started successfully.",
        variant: "default",
      });
      
      // Navigate to the inspection detail page
      navigate(`/inspection-detail/${data.id}`);
    },
    onError: (error: Error) => {
      console.error("Start inspection error:", error);
      toast({
        title: "Failed to start inspection",
        description: error.message || "Error starting inspection",
        variant: "destructive",
      });
    }
  });
  
  // Mutation for completing an inspection
  const completeInspectionMutation = useMutation({
    mutationFn: async (inspectionId: number) => {
      try {
        const res = await apiRequest("PATCH", `/api/inspections/${inspectionId}`, {
          status: "completed",
          completion_date: new Date().toISOString() // Convert to ISO string format for proper date handling
        });
        return await res.json();
      } catch (error) {
        console.error("Complete inspection error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inspections"] });
      toast({
        title: "Inspection completed",
        description: "The inspection has been completed successfully.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      console.error("Complete inspection error:", error);
      toast({
        title: "Failed to complete inspection",
        description: error.message || "Error completing inspection",
        variant: "destructive",
      });
    }
  });
  
  // Mutation for fetching vehicle details from VIN
  const decodeVinMutation = useMutation({
    mutationFn: async (vin: string) => {
      const res = await apiRequest("GET", `/api/vehicle/decode-vin/${vin}`);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "VIN decoded successfully",
        description: `Vehicle: ${data.year} ${data.make} ${data.model}`,
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to decode VIN",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Filter inspections by date based on active tab
  const getFilteredInspections = () => {
    if (!inspections) return [];
    
    let filtered = [...inspections];
    
    // First apply VIN filter if set
    if (filterVin) {
      filtered = filtered.filter(insp => 
        insp.vehicle.vin?.toLowerCase().includes(filterVin.toLowerCase())
      );
    }
    
    // Then apply pending filter if set
    if (showOnlyPending) {
      filtered = filtered.filter(insp => insp.status === "pending" || insp.status === "in_progress");
    }
    
    // Then apply date filter based on tab
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (activeTab === "today") {
      filtered = filtered.filter(insp => {
        // Use inspection_date if available, otherwise use scheduled_date
        const date = insp.inspection_date 
          ? new Date(insp.inspection_date) 
          : insp.scheduled_date 
            ? new Date(insp.scheduled_date) 
            : null;
            
        if (!date) return false;
        date.setHours(0, 0, 0, 0);
        return date.getTime() === today.getTime();
      });
    } else if (activeTab === "upcoming") {
      filtered = filtered.filter(insp => {
        // Use inspection_date if available, otherwise use scheduled_date
        const date = insp.inspection_date 
          ? new Date(insp.inspection_date) 
          : insp.scheduled_date 
            ? new Date(insp.scheduled_date) 
            : null;
            
        if (!date) return false;
        date.setHours(0, 0, 0, 0);
        return date.getTime() > today.getTime();
      });
    } else if (activeTab === "completed") {
      filtered = filtered.filter(insp => insp.status === "completed");
    }
    
    // Sort by inspection/scheduled date first, then by lane and run number
    return filtered.sort((a, b) => {
      // Sort by date (asc) - use inspection_date if available, otherwise use scheduled_date
      const dateA = a.inspection_date 
        ? new Date(a.inspection_date).getTime() 
        : a.scheduled_date 
          ? new Date(a.scheduled_date).getTime() 
          : 0;
      const dateB = b.inspection_date 
        ? new Date(b.inspection_date).getTime() 
        : b.scheduled_date 
          ? new Date(b.scheduled_date).getTime() 
          : 0;
      
      if (dateA !== dateB) return dateA - dateB;
      
      // If dates are equal, sort by lane number (asc)
      const laneA = String(a.vehicle.lane_number || "");
      const laneB = String(b.vehicle.lane_number || "");
      
      if (laneA !== laneB) {
        // Try to sort numerically if possible
        const numA = parseInt(laneA || "0");
        const numB = parseInt(laneB || "0");
        
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return String(laneA).localeCompare(String(laneB));
      }
      
      // If lane numbers are equal, sort by run number (asc)
      const runA = String(a.vehicle.run_number || "");
      const runB = String(b.vehicle.run_number || "");
      
      // Try to sort numerically if possible
      const numRunA = parseInt(runA || "0");
      const numRunB = parseInt(runB || "0");
      
      if (!isNaN(numRunA) && !isNaN(numRunB)) return numRunA - numRunB;
      return String(runA).localeCompare(String(runB));
    });
  };

  const filteredInspections = getFilteredInspections();

  return (
    <>
      <Helmet>
        <title>Inspector Dashboard | AutoInspect Pro</title>
      </Helmet>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Inspector Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage and track your assigned vehicle inspections
          </p>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Inspector Controls</CardTitle>
              <CardDescription>Select an inspector to view their assigned inspections</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="inspector">Select Inspector</Label>
                  <Select value={inspectorId} onValueChange={setInspectorId}>
                    <SelectTrigger id="inspector" className="w-full">
                      <SelectValue placeholder="Select inspector" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingInspectors ? (
                        <div className="flex items-center justify-center py-2">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      ) : (
                        inspectors?.map((inspector) => (
                          <SelectItem key={inspector.id} value={inspector.id.toString()}>
                            {inspector.user?.name || `Inspector #${inspector.id}`}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="vin-filter">Filter by VIN</Label>
                  <Input
                    id="vin-filter"
                    placeholder="Enter VIN"
                    value={filterVin}
                    onChange={(e) => setFilterVin(e.target.value)}
                  />
                </div>
                
                <div className="flex items-end pb-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="pending-only"
                      checked={showOnlyPending}
                      onCheckedChange={setShowOnlyPending}
                    />
                    <Label htmlFor="pending-only">Show only pending inspections</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {inspectorId && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Inspections</CardTitle>
                <CardDescription>
                  {loadingInspections ? 
                    "Loading inspections..." : 
                    `${filteredInspections.length} inspections found`
                  }
                </CardDescription>
                <Tabs defaultValue="today" value={activeTab} onValueChange={setActiveTab}>
                  <TabsList>
                    <TabsTrigger value="today">Today</TabsTrigger>
                    <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                    <TabsTrigger value="all">All</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent>
                {loadingInspections ? (
                  <div className="w-full flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredInspections.length > 0 ? (
                  <ScrollArea className="h-[600px] md:h-[500px]">
                    <div className="space-y-4">
                      {filteredInspections.map((inspection) => (
                        <Card key={inspection.id} className="overflow-hidden">
                          <div className="p-4">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                              <div>
                                <h3 className="text-lg font-medium">
                                  {inspection.vehicle.year} {inspection.vehicle.make} {inspection.vehicle.model}
                                </h3>
                                <p className="text-sm text-gray-500">
                                  VIN: {inspection.vehicle.vin}
                                </p>
                                <div className="mt-1">
                                  <Badge className={getStatusBadgeClass(inspection.status)}>
                                    {inspection.status.replace('_', ' ').charAt(0).toUpperCase() + inspection.status.replace('_', ' ').slice(1)}
                                  </Badge>
                                </div>
                              </div>
                              
                              <div className="mt-2 md:mt-0 flex flex-col items-start md:items-end">
                                <p className="text-sm font-medium">
                                  {inspection.dealer.name}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {inspection.inspection_date ? 'Inspection Date:' : 'Scheduled:'} {
                                    formatDateTime(inspection.inspection_date || inspection.scheduled_date || null)
                                  }
                                </p>
                                <p className="text-sm text-gray-500">
                                  Lane: {inspection.vehicle.lane_number || 'N/A'}, 
                                  Run: {inspection.vehicle.run_number || 'N/A'}
                                </p>
                              </div>
                            </div>
                            
                            <Separator className="my-3" />
                            
                            <div className="flex flex-wrap gap-2">
                              {/* Pending inspections can be started */}
                              {inspection.status === "pending" && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="bg-blue-50 text-blue-700 hover:bg-blue-100"
                                  onClick={() => startInspectionMutation.mutate(inspection.id)}
                                  disabled={startInspectionMutation.isPending}
                                >
                                  {startInspectionMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                  ) : (
                                    <FileText className="h-4 w-4 mr-1" />
                                  )}
                                  Start Inspection
                                </Button>
                              )}
                              
                              {/* In progress inspections can be continued or completed */}
                              {inspection.status === "in_progress" && (
                                <>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="bg-blue-50 text-blue-700 hover:bg-blue-100"
                                    onClick={() => navigate(`/inspection-detail/${inspection.id}`)}
                                  >
                                    <FileText className="h-4 w-4 mr-1" />
                                    Continue Inspection
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="bg-green-50 text-green-700 hover:bg-green-100"
                                    onClick={() => completeInspectionMutation.mutate(inspection.id)}
                                    disabled={completeInspectionMutation.isPending}
                                  >
                                    {completeInspectionMutation.isPending ? (
                                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                    ) : (
                                      <Check className="h-4 w-4 mr-1" />
                                    )}
                                    Complete Inspection
                                  </Button>
                                </>
                              )}
                              
                              {/* Canceled inspections can be restarted */}
                              {inspection.status === "canceled" && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="bg-blue-50 text-blue-700 hover:bg-blue-100"
                                  onClick={() => navigate(`/inspection-detail/${inspection.id}`)}
                                >
                                  <FileText className="h-4 w-4 mr-1" />
                                  View Inspection
                                </Button>
                              )}
                              
                              {/* Completed inspections can be viewed */}
                              {inspection.status === "completed" && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => navigate(`/inspection-detail/${inspection.id}`)}
                                >
                                  <FileText className="h-4 w-4 mr-1" />
                                  View Details
                                </Button>
                              )}
                              
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => inspection.vehicle.vin && decodeVinMutation.mutate(inspection.vehicle.vin)}
                                disabled={decodeVinMutation.isPending || !inspection.vehicle.vin}
                              >
                                {decodeVinMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                ) : (
                                  <span>Decode VIN</span>
                                )}
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No inspections found matching your criteria.
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}