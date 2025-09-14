import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, ArrowLeft, Camera, Video, FileText, DollarSign, Star } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Inspection {
  id: number;
  status: string;
  scheduled_date: string;
  completed_date: string;
  priority: string;
  notes: string;
  is_recommended?: boolean;
  vehicle: {
    id: number;
    make: string;
    model: string;
    year: number;
    color: string;
    vin: string;
    lane: string;
    run_number: number;
  };
  dealer?: {
    name: string;
  };
  inspector?: {
    user: {
      name: string;
    };
  };
}

interface InspectionResult {
  photos: string[];
  walkaround_video: string;
  engine_video: string;
  cosmetic_estimate: number;
  mechanical_estimate: number;
  voice_notes: string[];
  overall_condition: string;
  recommendation: string;
}

export default function InspectionDetailSimple() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: inspection, isLoading } = useQuery<Inspection>({
    queryKey: ["/api/inspections", id],
  });

  const { data: result, isLoading: isLoadingResult } = useQuery<InspectionResult>({
    queryKey: ["/api/inspections", id, "result"],
    enabled: !!inspection && inspection.status === "completed",
  });

  const completeInspectionMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/inspections/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed", completed_date: new Date().toISOString() }),
      });
      if (!response.ok) throw new Error("Failed to complete inspection");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inspections"] });
      toast({
        title: "Success",
        description: "Inspection completed successfully",
      });
      navigate("/inspector-portal");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to complete inspection",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <h2 className="text-2xl font-bold mb-2">Inspection Not Found</h2>
        <p className="text-muted-foreground mb-4">The inspection you're looking for doesn't exist.</p>
        <Button onClick={() => navigate("/inspector-portal")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Portal
        </Button>
      </div>
    );
  }

  const isCompletedInspection = inspection.status === "completed";
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/inspector-portal")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Inspector Portal
          </Button>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {inspection.vehicle.year} {inspection.vehicle.make} {inspection.vehicle.model}
              </h1>
              <p className="text-lg text-muted-foreground">
                Lane {inspection.vehicle.lane} • Run #{inspection.vehicle.run_number}
              </p>
            </div>
            <div className="flex items-center gap-2 mt-2 sm:mt-0">
              <Badge 
                variant={isCompletedInspection ? "default" : "secondary"}
              >
                {inspection.status.replace("_", " ").toUpperCase()}
              </Badge>
              {inspection.is_recommended && (
                <Badge variant="default" className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                  <Star className="h-3 w-3 mr-1" />
                  RECOMMENDED
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Prominent Notes Display */}
        {inspection.notes && inspection.notes.trim() !== "" && inspection.notes !== "Created via batch upload" && (
          <div className="max-w-4xl mx-auto mb-6">
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-amber-800">
                  <span className="animate-pulse text-lg">⚠️</span>
                  <span>Important Notes</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-amber-900 font-medium whitespace-pre-wrap">{inspection.notes}</p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
                  {isCompletedInspection ? <Check className="h-4 w-4" /> : "!"}
                </div>
                <span>
                  {isCompletedInspection ? "Completed Inspection" : "Vehicle Inspection"}
                </span>
              </CardTitle>
              <CardDescription>
                {isCompletedInspection 
                  ? "Review the completed inspection details including photos, videos, and estimates" 
                  : "Complete all required fields for the standardized inspection format"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isCompletedInspection ? (
                <div className="space-y-8">
                  {/* Vehicle Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium mb-2">Vehicle Details</h3>
                      <p><strong>VIN:</strong> {inspection.vehicle.vin || "Not provided"}</p>
                      <p><strong>Color:</strong> {inspection.vehicle.color}</p>
                    </div>
                    <div>
                      <h3 className="font-medium mb-2">Inspection Info</h3>
                      <p><strong>Inspector:</strong> {inspection.inspector?.user.name || "Unassigned"}</p>
                      <p><strong>Dealer:</strong> {inspection.dealer?.name || "Not specified"}</p>
                    </div>
                  </div>

                  {/* Inspection Results */}
                  {isLoadingResult ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : result ? (
                    <div className="space-y-6">
                      {/* Photos Section */}
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Camera className="h-5 w-5 text-blue-600" />
                          <h3 className="text-lg font-medium">Photos ({result.photos?.length || 0})</h3>
                        </div>
                        {result.photos?.length ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {result.photos.map((photo, index) => (
                              <div key={index} className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                                <span className="text-sm text-gray-500">Photo {index + 1}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 italic">No photos uploaded</p>
                        )}
                      </div>

                      {/* Videos Section */}
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Video className="h-5 w-5 text-blue-600" />
                          <h3 className="text-lg font-medium">Videos</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 border rounded-lg">
                            <h4 className="font-medium mb-2">Walkaround Video</h4>
                            {result.walkaround_video ? (
                              <div className="aspect-video bg-gray-100 rounded flex items-center justify-center">
                                <span className="text-sm text-gray-500">Video Available</span>
                              </div>
                            ) : (
                              <p className="text-gray-500 italic">No walkaround video</p>
                            )}
                          </div>
                          <div className="p-4 border rounded-lg">
                            <h4 className="font-medium mb-2">Engine Video</h4>
                            {result.engine_video ? (
                              <div className="aspect-video bg-gray-100 rounded flex items-center justify-center">
                                <span className="text-sm text-gray-500">Video Available</span>
                              </div>
                            ) : (
                              <p className="text-gray-500 italic">No engine video</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Estimates Section */}
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-5 w-5 text-blue-600" />
                          <h3 className="text-lg font-medium">Cost Estimates</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 border rounded-lg">
                            <h4 className="font-medium">Cosmetic Repairs</h4>
                            <p className="text-2xl font-bold text-green-600">
                              ${result.cosmetic_estimate?.toLocaleString() || "0"}
                            </p>
                          </div>
                          <div className="p-4 border rounded-lg">
                            <h4 className="font-medium">Mechanical Repairs</h4>
                            <p className="text-2xl font-bold text-orange-600">
                              ${result.mechanical_estimate?.toLocaleString() || "0"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Condition & Recommendation */}
                      <div className="space-y-4">
                        <div className="p-4 border rounded-lg">
                          <h4 className="font-medium mb-2">Overall Condition</h4>
                          <p className="text-lg">{result.overall_condition || "Not specified"}</p>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <h4 className="font-medium mb-2">Recommendation</h4>
                          <p>{result.recommendation || "No recommendation provided"}</p>
                        </div>
                      </div>

                      {/* Voice Notes */}
                      {result.voice_notes?.length && (
                        <div className="space-y-4">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-5 w-5 text-blue-600" />
                            <h3 className="text-lg font-medium">Voice Notes</h3>
                          </div>
                          <div className="space-y-2">
                            {result.voice_notes.map((note, index) => (
                              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm">{note}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No inspection results available</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="text-center py-12">
                    <h3 className="text-xl font-medium mb-4">Inspection Form</h3>
                    <p className="text-gray-600 mb-6">
                      Complete the standardized 6-step inspection process including photos, videos, and estimates.
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-md mx-auto">
                      <div className="p-4 border rounded-lg text-center">
                        <Camera className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm">Photos</p>
                      </div>
                      <div className="p-4 border rounded-lg text-center">
                        <Video className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm">Walkaround</p>
                      </div>
                      <div className="p-4 border rounded-lg text-center">
                        <Video className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm">Engine</p>
                      </div>
                      <div className="p-4 border rounded-lg text-center">
                        <DollarSign className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm">Cosmetic</p>
                      </div>
                      <div className="p-4 border rounded-lg text-center">
                        <DollarSign className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm">Mechanical</p>
                      </div>
                      <div className="p-4 border rounded-lg text-center">
                        <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm">Notes</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            
            {!isCompletedInspection && (
              <div className="px-6 pb-6">
                <div className="flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate("/inspector-portal")}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => completeInspectionMutation.mutate()}
                    disabled={completeInspectionMutation.isPending}
                  >
                    {completeInspectionMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    Complete Inspection
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}