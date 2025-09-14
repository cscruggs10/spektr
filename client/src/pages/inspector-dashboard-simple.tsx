import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Play, CheckCircle } from "lucide-react";
import { format } from "date-fns";
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
    case "canceled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export default function InspectorDashboardSimple() {
  const [inspectorId, setInspectorId] = useState<string>("");
  const { toast } = useToast();

  // Get inspectors
  const { data: inspectors = [], isLoading: loadingInspectors } = useQuery({
    queryKey: ["/api/inspectors"],
  });

  // Get inspections for selected inspector
  const { data: inspections = [], isLoading: loadingInspections } = useQuery({
    queryKey: ["/api/inspections", { inspectorId: inspectorId ? parseInt(inspectorId) : undefined }],
    enabled: !!inspectorId,
    queryFn: async () => {
      if (!inspectorId) return [];
      const response = await fetch(`/api/inspections?inspectorId=${inspectorId}`);
      if (!response.ok) throw new Error("Failed to fetch inspections");
      return response.json();
    }
  });

  // Start inspection mutation
  const startInspectionMutation = useMutation({
    mutationFn: async (inspectionId: number) => {
      const res = await apiRequest("PATCH", `/api/inspections/${inspectionId}`, {
        status: "in_progress",
        start_date: new Date().toISOString()
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inspections"] });
      toast({
        title: "Inspection started",
        description: "The inspection has been started successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to start inspection",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Complete inspection mutation
  const completeInspectionMutation = useMutation({
    mutationFn: async (inspectionId: number) => {
      const res = await apiRequest("PATCH", `/api/inspections/${inspectionId}`, {
        status: "completed",
        completion_date: new Date().toISOString()
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inspections"] });
      toast({
        title: "Inspection completed",
        description: "The inspection has been completed successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to complete inspection",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const filteredInspections = inspections.filter((inspection: any) => 
    !inspectorId || inspection.inspector_id === parseInt(inspectorId)
  );

  return (
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
                      inspectors?.map((inspector: any) => (
                        <SelectItem key={inspector.id} value={inspector.id.toString()}>
                          {inspector.user?.name || `Inspector #${inspector.id}`}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inspections List */}
        {inspectorId && (
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Assigned Inspections</CardTitle>
                <CardDescription>
                  Inspections assigned to the selected inspector
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingInspections ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredInspections.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No inspections assigned to this inspector
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredInspections.map((inspection: any) => (
                      <Card key={inspection.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Badge className={getStatusBadgeClass(inspection.status)}>
                                  {inspection.status.replace('_', ' ').charAt(0).toUpperCase() + 
                                   inspection.status.replace('_', ' ').slice(1)}
                                </Badge>
                                {inspection.vehicle?.lane_number && (
                                  <span className="text-sm text-gray-600">
                                    Lane {inspection.vehicle.lane_number}
                                    {inspection.vehicle.run_number && ` / Run ${inspection.vehicle.run_number}`}
                                  </span>
                                )}
                              </div>
                              
                              <div className="font-medium">
                                {inspection.vehicle?.year} {inspection.vehicle?.make} {inspection.vehicle?.model}
                              </div>
                              
                              {inspection.vehicle?.vin && (
                                <div className="text-sm text-gray-600">
                                  VIN: {inspection.vehicle.vin}
                                </div>
                              )}
                              
                              <div className="text-sm text-gray-600">
                                Scheduled: {formatDateTime(inspection.scheduled_date)}
                              </div>
                              
                              {inspection.notes && (
                                <div className="text-sm text-gray-600">
                                  Notes: {inspection.notes}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex flex-col gap-2">
                              {inspection.status === "pending" && (
                                <Button
                                  onClick={() => startInspectionMutation.mutate(inspection.id)}
                                  disabled={startInspectionMutation.isPending}
                                  size="sm"
                                >
                                  {startInspectionMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <Play className="h-4 w-4 mr-2" />
                                      Start Inspection
                                    </>
                                  )}
                                </Button>
                              )}
                              
                              {inspection.status === "in_progress" && (
                                <Button
                                  onClick={() => completeInspectionMutation.mutate(inspection.id)}
                                  disabled={completeInspectionMutation.isPending}
                                  variant="outline"
                                  size="sm"
                                >
                                  {completeInspectionMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Complete
                                    </>
                                  )}
                                </Button>
                              )}
                              
                              {inspection.status === "completed" && (
                                <span className="text-sm text-green-600 font-medium">
                                  ✓ Completed
                                </span>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}