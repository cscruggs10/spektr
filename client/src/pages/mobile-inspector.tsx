import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Play, CheckCircle, Car, Clock, MapPin, FileText, Camera, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

function formatDateTime(date: string | Date | null) {
  if (!date) return "N/A";
  return format(new Date(date), "MMM d, h:mm a");
}

function getStatusColor(status: string) {
  switch (status) {
    case "pending":
      return "bg-blue-500";
    case "in_progress":
      return "bg-yellow-500";
    case "completed":
      return "bg-green-500";
    case "canceled":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
}

export default function MobileInspector() {
  const [inspectorId, setInspectorId] = useState<string>("");
  const [activeInspection, setActiveInspection] = useState<any>(null);
  const [inspectionNotes, setInspectionNotes] = useState<string>("");
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const { toast } = useToast();

  // Get inspectors
  const { data: inspectors = [], isLoading: loadingInspectors } = useQuery({
    queryKey: ["/api/inspectors"],
    queryFn: async () => {
      const response = await fetch("/api/inspectors");
      if (!response.ok) throw new Error("Failed to fetch inspectors");
      return response.json();
    }
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
    onSuccess: (data, inspectionId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/inspections"] });
      // Find the inspection that was started
      const inspection = filteredInspections.find(i => i.id === inspectionId);
      if (inspection) {
        setActiveInspection(inspection);
        setShowInspectionModal(true);
      }
      toast({
        title: "Inspection started",
        description: "Beginning vehicle inspection process.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
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
        description: "Great job! The inspection has been marked as complete.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const filteredInspections = inspections.filter((inspection: any) => 
    !inspectorId || inspection.inspector_id === parseInt(inspectorId)
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Mobile Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900 text-center">Inspector Dashboard</h1>
          <p className="text-sm text-gray-600 text-center">Mobile Inspection Tool</p>
        </div>
      </div>

      {/* Inspector Selection */}
      <div className="p-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Select Inspector</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={inspectorId} onValueChange={setInspectorId}>
              <SelectTrigger className="w-full h-12 text-base">
                <SelectValue placeholder="Choose your inspector ID" />
              </SelectTrigger>
              <SelectContent>
                {loadingInspectors ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                  </div>
                ) : (
                  inspectors?.map((inspector: any) => (
                    <SelectItem key={inspector.id} value={inspector.id.toString()} className="text-base py-3">
                      {inspector.user?.name || `Inspector #${inspector.id}`}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* Inspections List */}
      {inspectorId && (
        <div className="px-4 pb-4">
          {loadingInspections ? (
            <Card>
              <CardContent className="py-8">
                <div className="flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  <p className="text-gray-600">Loading your inspections...</p>
                </div>
              </CardContent>
            </Card>
          ) : filteredInspections.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center space-y-3">
                  <Car className="h-12 w-12 mx-auto text-gray-400" />
                  <p className="text-lg font-medium text-gray-900">No Inspections</p>
                  <p className="text-gray-600">You have no assigned inspections at this time.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Your Inspections</h2>
                <Badge variant="outline" className="text-sm">
                  {filteredInspections.length} total
                </Badge>
              </div>
              
              {filteredInspections.map((inspection: any) => (
                <Card key={inspection.id} className="border-l-4" style={{ borderLeftColor: getStatusColor(inspection.status).replace('bg-', '#') }}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Status and Lane Info */}
                      <div className="flex items-center justify-between">
                        <Badge className={`${getStatusColor(inspection.status)} text-white text-xs px-2 py-1`}>
                          {inspection.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        {inspection.vehicle?.lane_number && (
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="h-4 w-4 mr-1" />
                            Lane {inspection.vehicle.lane_number}
                            {inspection.vehicle.run_number && ` / Run ${inspection.vehicle.run_number}`}
                          </div>
                        )}
                      </div>
                      
                      {/* Vehicle Info */}
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">
                          {inspection.vehicle?.year} {inspection.vehicle?.make} {inspection.vehicle?.model}
                        </h3>
                        {inspection.vehicle?.vin && (
                          <p className="text-sm text-gray-600 font-mono">
                            VIN: {inspection.vehicle.vin}
                          </p>
                        )}
                      </div>
                      
                      {/* Schedule Info */}
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-2" />
                        Scheduled: {formatDateTime(inspection.scheduled_date)}
                      </div>
                      
                      {/* Notes */}
                      {inspection.notes && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700">{inspection.notes}</p>
                        </div>
                      )}
                      
                      {/* Action Buttons */}
                      <div className="pt-2">
                        {inspection.status === "pending" && (
                          <Button
                            onClick={() => startInspectionMutation.mutate(inspection.id)}
                            disabled={startInspectionMutation.isPending}
                            className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700"
                          >
                            {startInspectionMutation.isPending ? (
                              <Loader2 className="h-5 w-5 animate-spin mr-2" />
                            ) : (
                              <Play className="h-5 w-5 mr-2" />
                            )}
                            Start Inspection
                          </Button>
                        )}
                        
                        {inspection.status === "in_progress" && (
                          <Button
                            onClick={() => completeInspectionMutation.mutate(inspection.id)}
                            disabled={completeInspectionMutation.isPending}
                            className="w-full h-12 text-base bg-green-600 hover:bg-green-700"
                          >
                            {completeInspectionMutation.isPending ? (
                              <Loader2 className="h-5 w-5 animate-spin mr-2" />
                            ) : (
                              <CheckCircle className="h-5 w-5 mr-2" />
                            )}
                            Mark Complete
                          </Button>
                        )}
                        
                        {inspection.status === "completed" && (
                          <div className="flex items-center justify-center py-3 text-green-600 font-medium">
                            <CheckCircle className="h-5 w-5 mr-2" />
                            Completed
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Inspection Modal */}
      <Dialog open={showInspectionModal} onOpenChange={setShowInspectionModal}>
        <DialogContent className="w-[95vw] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Vehicle Inspection</DialogTitle>
            <DialogDescription>
              Conducting inspection for {activeInspection?.vehicle?.year} {activeInspection?.vehicle?.make} {activeInspection?.vehicle?.model}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Vehicle Details */}
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Car className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">Vehicle Information</span>
                </div>
                
                {activeInspection?.vehicle?.vin && (
                  <div className="text-sm">
                    <span className="font-medium">VIN:</span> {activeInspection.vehicle.vin}
                  </div>
                )}
                
                {activeInspection?.vehicle?.lane_number && (
                  <div className="text-sm">
                    <span className="font-medium">Location:</span> Lane {activeInspection.vehicle.lane_number}
                    {activeInspection.vehicle.run_number && ` / Run ${activeInspection.vehicle.run_number}`}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Inspection Checklist */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Inspection Checklist</span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="w-4 h-4" />
                    <span>Exterior condition check</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="w-4 h-4" />
                    <span>Interior condition check</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="w-4 h-4" />
                    <span>Engine bay inspection</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="w-4 h-4" />
                    <span>Tire condition assessment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="w-4 h-4" />
                    <span>Mileage verification</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Inspection Notes */}
            <div className="space-y-2">
              <Label htmlFor="inspection-notes" className="text-sm font-medium">
                Inspection Notes
              </Label>
              <Textarea
                id="inspection-notes"
                placeholder="Enter any notes about the vehicle condition, damages, or observations..."
                value={inspectionNotes}
                onChange={(e) => setInspectionNotes(e.target.value)}
                className="min-h-[100px] text-base"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowInspectionModal(false);
                  setActiveInspection(null);
                  setInspectionNotes("");
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              
              <Button
                onClick={() => {
                  if (activeInspection) {
                    completeInspectionMutation.mutate(activeInspection.id);
                  }
                  setShowInspectionModal(false);
                  setActiveInspection(null);
                  setInspectionNotes("");
                }}
                disabled={completeInspectionMutation.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {completeInspectionMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Complete Inspection
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}