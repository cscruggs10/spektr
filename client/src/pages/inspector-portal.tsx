import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import imageCompression from 'browser-image-compression';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Play, CheckCircle, Car, Clock, MapPin, FileText, User, LogOut, Camera, Video, Mic, X } from "lucide-react";
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
      return "bg-yellow-500";
    case "in_progress":
      return "bg-blue-500";
    case "completed":
      return "bg-green-500";
    case "canceled":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
}

export default function InspectorPortal() {
  const [inspectorId, setInspectorId] = useState<string>("");
  const [selectedAuctionId, setSelectedAuctionId] = useState<string>("all");
  const [activeInspection, setActiveInspection] = useState<any>(null);
  const [inspectionNotes, setInspectionNotes] = useState<string>("");
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [showSkipDialog, setShowSkipDialog] = useState(false);
  const [skipReason, setSkipReason] = useState("");
  const [skipNote, setSkipNote] = useState("");
  const [skipPhoto, setSkipPhoto] = useState<File | null>(null);
  
  // Inspection form data
  const [cosmeticEstimate, setCosmeticEstimate] = useState<string>("");
  const [cosmeticDetails, setCosmeticDetails] = useState<string>("");
  const [mechanicalEstimate, setMechanicalEstimate] = useState<string>("");
  const [mechanicalDetails, setMechanicalDetails] = useState<string>("");
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [voiceNote, setVoiceNote] = useState<Blob | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isRecommended, setIsRecommended] = useState(false);
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  
  // Track completion status for each section
  const [sectionStatus, setSectionStatus] = useState({
    photos: false,
    walkaroundVideo: false,
    engineVideo: false,
    cosmetics: false,
    mechanical: false,
    notes: false
  });
  
  const { toast } = useToast();

  // Get inspectors for login selection
  const { data: inspectors = [], isLoading: loadingInspectors } = useQuery({
    queryKey: ["/api/inspectors"],
  });

  // Get current inspector and set language preference
  const currentInspector = inspectors.find((i: any) => i.id === parseInt(inspectorId));
  
  useEffect(() => {
    if (currentInspector?.language) {
      setLanguage(currentInspector.language as 'en' | 'es');
    }
  }, [currentInspector]);

  // Get auctions for filter dropdown
  const { data: auctions = [] } = useQuery({
    queryKey: ["/api/auctions"],
  });

  // Get inspections for selected inspector only - exclude completed ones
  const { data: inspections = [], isLoading: loadingInspections } = useQuery({
    queryKey: ["/api/inspections"],
    enabled: !!inspectorId,
    select: (data) => {
      // Filter to only show inspections assigned to this inspector AND exclude completed ones
      let filtered = data.filter((inspection: any) => 
        inspection.inspector_id === parseInt(inspectorId) &&
        inspection.status !== 'completed'
      );

      // Apply auction filter if selected
      if (selectedAuctionId && selectedAuctionId !== "all") {
        filtered = filtered.filter((inspection: any) => {
          const auctionId = inspection.vehicle?.runlist?.auction_id || inspection.auction_id;
          return auctionId === parseInt(selectedAuctionId);
        });
      }
      
      // Sort by lane number first, then by run number
      return filtered.sort((a: any, b: any) => {
        const aLane = parseInt(a.vehicle?.lane_number || 0);
        const bLane = parseInt(b.vehicle?.lane_number || 0);
        const aRun = parseInt(a.vehicle?.run_number || 0);
        const bRun = parseInt(b.vehicle?.run_number || 0);
        
        // First sort by lane number
        if (aLane !== bLane) {
          return aLane - bLane;
        }
        
        // Then sort by run number within same lane
        return aRun - bRun;
      });
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
      const inspection = inspections.find(i => i.id === inspectionId);
      if (inspection) {
        setActiveInspection(inspection);
        setShowInspectionModal(true);
        // Reset section status for new inspection
        setSectionStatus({ photos: false, walkaroundVideo: false, engineVideo: false, cosmetics: false, mechanical: false, notes: false });
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

  // Skip inspection mutation
  const skipInspectionMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append("reason", skipReason);
      formData.append("note", skipNote);
      if (skipPhoto) {
        formData.append("photo", skipPhoto);
      }
      
      const res = await apiRequest("POST", `/api/inspections/${activeInspection?.id}/skip`, formData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Inspection Skipped",
        description: "This vehicle has been passed for inspection",
      });
      setShowSkipDialog(false);
      setShowInspectionModal(false);
      setActiveInspection(null);
      setSkipReason("");
      setSkipNote("");
      setSkipPhoto(null);
      queryClient.invalidateQueries({ queryKey: ["/api/inspections"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Skip Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Complete inspection mutation
  const completeInspectionMutation = useMutation({
    mutationFn: async (inspectionId: number) => {
      const formData = new FormData();
      formData.append("status", "completed");
      formData.append("end_date", new Date().toISOString());
      formData.append("notes", inspectionNotes);
      formData.append("cosmetic_estimate", cosmeticEstimate || "0");
      formData.append("cosmetic_details", cosmeticDetails);
      formData.append("mechanical_estimate", mechanicalEstimate || "0");
      formData.append("mechanical_details", mechanicalDetails);
      formData.append("is_recommended", isRecommended.toString());
      
      if (voiceNote) {
        formData.append("voice_note", voiceNote, "voice_note.webm");
        formData.append("voice_language", language); // Send language preference
      }

      const res = await apiRequest("PATCH", `/api/inspections/${inspectionId}`, formData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inspections"] });
      toast({
        title: "Inspection completed",
        description: "Vehicle inspection has been successfully completed.",
      });
      // Clear form and close modal
      setShowInspectionModal(false);
      setActiveInspection(null);
      setInspectionNotes("");
      setCosmeticEstimate("");
      setCosmeticDetails("");
      setMechanicalEstimate("");
      setMechanicalDetails("");
      setVoiceNote(null);
      setUploadedFiles([]);
      setIsRecommended(false);
      setSectionStatus({ photos: false, walkaroundVideo: false, engineVideo: false, cosmetics: false, mechanical: false, notes: false });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setVoiceNote(blob);
        stream.getTracks().forEach(track => track.stop());
        // Mark notes section complete when voice note is recorded
        setSectionStatus(prev => ({ ...prev, notes: true }));
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      toast({
        title: "Recording Error",
        description: "Could not access microphone",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setMediaRecorder(null);
      setIsRecording(false);
    }
  };

  const selectedInspector = inspectors.find(i => i.id === parseInt(inspectorId));

  // Show inspector login screen if no inspector selected - Simple design optimized for sunlight
  if (!inspectorId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900/50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg text-center">
          {/* Large Logo Section - 3/4 of screen on mobile */}
          <div className="mb-8">
            <img 
              src="/spektr-logo.svg" 
              alt="SPEKTR" 
              className="w-full max-w-xs md:max-w-sm mx-auto mb-6 h-[50vh] md:h-[40vh] object-contain"
            />
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
              SPEKTR
            </h1>
            <p className="text-xl text-gray-300 font-semibold">INSPECTOR PORTAL</p>
          </div>
          
          {/* Simple Card with Dropdown */}
          <Card className="border-2 border-gray-600 bg-gray-800/90 backdrop-blur shadow-2xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-white">Welcome Inspector</CardTitle>
              <p className="text-gray-300 mt-2">Select your name to access inspections</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <Select onValueChange={setInspectorId} disabled={loadingInspectors}>
                <SelectTrigger className="h-14 text-lg font-semibold bg-white/95 text-gray-900 border-2 border-gray-300 hover:bg-white">
                  <SelectValue placeholder={loadingInspectors ? "Loading..." : "Choose Your Name"} />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {inspectors.map((inspector) => (
                    <SelectItem 
                      key={inspector.id} 
                      value={inspector.id.toString()}
                      className="text-lg font-semibold py-3 hover:bg-blue-50"
                    >
                      {inspector.user?.username || `Inspector ${inspector.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Training Guide Link */}
              <a 
                href="/inspector-training-guide.html" 
                target="_blank"
                className="inline-flex items-center justify-center text-blue-400 hover:text-blue-300 font-semibold text-lg underline"
              >
                📚 View Training Guide
              </a>
              
              <p className="text-sm text-gray-400">
                Contact support if you don't see your name
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      {/* Header - Gradient style matching main app */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <img src="/spektr-logo.svg" alt="Spektr" className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white">Inspector Portal</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-base font-semibold text-white">
                <User className="h-5 w-5 mr-2" />
                {inspectors.find(i => i.id === parseInt(inspectorId))?.user?.username || "Inspector"}
              </div>
              <Button
                variant={language === 'es' ? "default" : "outline"}
                size="sm"
                onClick={async () => {
                  setLanguage('es');
                  // Save language preference to database
                  try {
                    await apiRequest('PATCH', `/api/inspectors/${inspectorId}`, { language: 'es' });
                  } catch (error) {
                    console.error('Failed to save language preference:', error);
                  }
                }}
                className="mr-1 font-semibold"
              >
                ES
              </Button>
              <Button
                variant={language === 'en' ? "default" : "outline"}
                size="sm"
                onClick={async () => {
                  setLanguage('en');
                  // Save language preference to database
                  try {
                    await apiRequest('PATCH', `/api/inspectors/${inspectorId}`, { language: 'en' });
                  } catch (error) {
                    console.error('Failed to save language preference:', error);
                  }
                }}
                className="mr-3 font-semibold"
              >
                EN
              </Button>
              <Button
                variant="destructive"
                size="default"
                onClick={() => {
                  setInspectorId("");
                  setActiveInspection(null);
                  setShowInspectionModal(false);
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">My Assigned Inspections</h2>
          <p className="text-gray-600 mt-2 text-lg">View and manage your vehicle inspection assignments</p>
        </div>

        {/* Auction Filter */}
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-64">
              <Label htmlFor="auction-filter" className="text-sm font-medium text-gray-700">
                Filter by Auction
              </Label>
              <Select value={selectedAuctionId} onValueChange={setSelectedAuctionId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All Auctions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Auctions</SelectItem>
                  {auctions.map((auction) => (
                    <SelectItem key={auction.id} value={auction.id.toString()}>
                      {auction.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-gray-600 pt-6">
              {selectedAuctionId && selectedAuctionId !== "all" ? (
                `Showing ${inspections.length} inspection${inspections.length !== 1 ? 's' : ''} for ${auctions.find(a => a.id === parseInt(selectedAuctionId))?.name}`
              ) : (
                `Showing ${inspections.length} total inspection${inspections.length !== 1 ? 's' : ''}`
              )}
            </div>
          </div>
        </div>

        {loadingInspections ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : inspections.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Car className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Inspections Assigned</h3>
              <p className="text-gray-600 text-center">
                You don't have any vehicle inspections assigned at the moment.
                Check back later or contact your supervisor.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {inspections.map((inspection) => (
              <Card key={inspection.id} className="hover:shadow-xl transition-all transform hover:-translate-y-1 border-2 hover:border-blue-400">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {inspection.vehicle?.year} {inspection.vehicle?.make} {inspection.vehicle?.model}
                    </CardTitle>
                    <Badge className={`text-white ${getStatusColor(inspection.status)}`}>
                      {inspection.status.replace("_", " ")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {inspection.vehicle?.vin && (
                    <div className="text-sm">
                      <span className="font-medium">VIN:</span> {inspection.vehicle.vin}
                    </div>
                  )}
                  
                  {inspection.vehicle?.lane_number && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-1" />
                      Lane {inspection.vehicle.lane_number}
                      {inspection.vehicle.run_number && ` / Run ${inspection.vehicle.run_number}`}
                    </div>
                  )}
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-1" />
                    Created: {formatDateTime(inspection.created_at)}
                  </div>

                  <div className="pt-3">
                    {inspection.status === "pending" && (
                      <Button
                        onClick={() => startInspectionMutation.mutate(inspection.id)}
                        disabled={startInspectionMutation.isPending}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-lg font-semibold h-12 shadow-lg"
                      >
                        {startInspectionMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Play className="h-4 w-4 mr-2" />
                        )}
                        Start Inspection
                      </Button>
                    )}
                    
                    {inspection.status === "in_progress" && (
                      <Button
                        onClick={() => {
                          setActiveInspection(inspection);
                          setShowInspectionModal(true);
                          setSectionStatus({ photos: false, walkaroundVideo: false, engineVideo: false, cosmetics: false, mechanical: false, notes: false });
                        }}
                        className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-lg font-semibold h-12 shadow-lg"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Continue Inspection
                      </Button>
                    )}
                    
                    {inspection.status === "completed" && (
                      <div className="space-y-3">
                        <div className="bg-gray-50 border rounded-lg p-3 text-xs">
                          <pre className="whitespace-pre-wrap">{JSON.stringify(inspection, null, 2)}</pre>
                        </div>
                        
                        <Button variant="outline" className="w-full" disabled>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Completed
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Inspection Modal */}
      <Dialog open={showInspectionModal} onOpenChange={setShowInspectionModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Vehicle Inspection</DialogTitle>
            <DialogDescription>
              Conducting inspection for {activeInspection?.vehicle?.year} {activeInspection?.vehicle?.make} {activeInspection?.vehicle?.model}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Vehicle Details */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <Car className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">Vehicle Information</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {activeInspection?.vehicle?.vin && (
                    <div>
                      <span className="font-medium">VIN:</span> {activeInspection.vehicle.vin}
                    </div>
                  )}
                  
                  {activeInspection?.vehicle?.lane_number && (
                    <div>
                      <span className="font-medium">Location:</span> Lane {activeInspection.vehicle.lane_number}
                      {activeInspection.vehicle.run_number && ` / Run ${activeInspection.vehicle.run_number}`}
                    </div>
                  )}
                  
                  {activeInspection?.vehicle?.mileage && (
                    <div>
                      <span className="font-medium">Mileage:</span> {activeInspection.vehicle.mileage.toLocaleString()}
                    </div>
                  )}
                  
                  {activeInspection?.vehicle?.color && (
                    <div>
                      <span className="font-medium">Color:</span> {activeInspection.vehicle.color}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Inspection Workflow Tabs - Responsive Layout */}
            <div className="border rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 text-sm md:text-xs">
                <div className={`p-3 md:p-2 border-r border-b text-center relative ${sectionStatus.photos ? 'bg-green-100' : 'bg-blue-50'}`}>
                  <div className="font-medium">1. Photos</div>
                  <div className="text-gray-500 text-xs">Run/VIN Labels</div>
                  {sectionStatus.photos && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl text-green-600 font-bold">✓</span>
                    </div>
                  )}
                </div>
                <div className={`p-3 md:p-2 border-b lg:border-r text-center relative ${sectionStatus.walkaroundVideo ? 'bg-green-100' : ''}`}>
                  <div className="font-medium">2. Walkaround</div>
                  <div className="text-gray-500 text-xs">1:30-2:00 min</div>
                  {sectionStatus.walkaroundVideo && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl text-green-600 font-bold">✓</span>
                    </div>
                  )}
                </div>
                <div className={`p-3 md:p-2 border-r border-b lg:border-r text-center relative ${sectionStatus.engineVideo ? 'bg-green-100' : ''}`}>
                  <div className="font-medium">3. Engine</div>
                  <div className="text-gray-500 text-xs">Running + HVAC</div>
                  {sectionStatus.engineVideo && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl text-green-600 font-bold">✓</span>
                    </div>
                  )}
                </div>
                <div className={`p-3 md:p-2 border-b lg:border-r text-center relative ${sectionStatus.cosmetics ? 'bg-green-100' : ''}`}>
                  <div className="font-medium">4. Cosmetics</div>
                  <div className="text-gray-500 text-xs">Estimate + Details</div>
                  {sectionStatus.cosmetics && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl text-green-600 font-bold">✓</span>
                    </div>
                  )}
                </div>
                <div className={`p-3 md:p-2 border-r border-b lg:border-b lg:border-r text-center relative ${sectionStatus.mechanical ? 'bg-green-100' : ''}`}>
                  <div className="font-medium">5. Mechanical</div>
                  <div className="text-gray-500 text-xs">Estimate + Details</div>
                  {sectionStatus.mechanical && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl text-green-600 font-bold">✓</span>
                    </div>
                  )}
                </div>
                <div className={`p-3 md:p-2 border-b lg:border-b text-center relative ${sectionStatus.notes ? 'bg-green-100' : ''}`}>
                  <div className="font-medium">6. Notes</div>
                  <div className="text-gray-500 text-xs">Voice + Text</div>
                  {sectionStatus.notes && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl text-green-600 font-bold">✓</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-4 space-y-6">
                {/* Photos Section */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center">
                    <Camera className="h-4 w-4 mr-2 text-blue-600" />
                    Run/VIN Label Photos
                    {sectionStatus.photos && <span className="ml-2 text-green-600">✓</span>}
                  </h4>
                  <p className="text-sm text-gray-500">Take clear photos of the vehicle's run label and VIN placard</p>
                  <div className="space-y-3">
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple 
                      className="hidden" 
                      id="photo-upload" 
                      capture="environment"
                      onChange={async (e) => {
                        if (e.target.files && e.target.files.length > 0 && activeInspection) {
                          console.log('Inspector portal photos selected:', e.target.files.length);
                          const formData = new FormData();
                          
                          // Show loading message
                          const loadingToast = toast({
                            title: "Compressing and uploading photos...",
                            description: "Please wait while we optimize your images",
                          });
                          
                          try {
                            // Compress each image before uploading
                            for (const file of Array.from(e.target.files)) {
                              console.log('Original file:', file.name, 'Size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
                              
                              const options = {
                                maxSizeMB: 1, // Max 1MB per image
                                maxWidthOrHeight: 1920, // Max 1920px width/height
                                useWebWorker: true,
                                fileType: 'image/jpeg', // Convert to JPEG for better compression
                              };
                              
                              const compressedFile = await imageCompression(file, options);
                              console.log('Compressed file:', compressedFile.name, 'Size:', (compressedFile.size / 1024 / 1024).toFixed(2), 'MB');
                              
                              // Create new file with original name
                              const renamedFile = new File([compressedFile], file.name, { type: compressedFile.type });
                              formData.append("files", renamedFile);
                            }
                            
                            const res = await fetch(`/api/inspections/${activeInspection.id}/uploads`, {
                              method: 'POST',
                              body: formData,
                            });
                            const data = await res.json();
                            console.log('Inspector portal photo upload response:', data);
                            if (res.ok) {
                              const newFiles = Array.from(e.target.files);
                              setUploadedFiles(prev => [...prev, ...newFiles]);
                              setSectionStatus(prev => ({ ...prev, photos: true }));
                              loadingToast.dismiss();
                              toast({
                                title: "Photos uploaded successfully!",
                                description: `${e.target.files.length} photo(s) have been uploaded`,
                              });
                            } else {
                              throw new Error(data.error || 'Upload failed');
                            }
                          } catch (error) {
                            console.error('Inspector portal photo upload error:', error);
                            loadingToast.dismiss();
                            toast({
                              title: "Upload failed",
                              description: error instanceof Error ? error.message : 'Unknown error',
                              variant: "destructive",
                            });
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      className="w-full bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100"
                      onClick={() => document.getElementById('photo-upload')?.click()}
                    >
                      <Camera className="h-5 w-5 mr-2" />
                      📷 Take Photos
                    </Button>
                    <p className="text-xs text-gray-500 text-center">Tap to open camera and take photos</p>
                  </div>
                </div>

                {/* Walkaround Video */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center">
                    <Video className="h-4 w-4 mr-2 text-green-600" />
                    Vehicle Walkaround Video
                    {sectionStatus.walkaroundVideo && <span className="ml-2 text-green-600">✓</span>}
                  </h4>
                  <p className="text-sm text-gray-500">Record 1:30-2:00 minute video walking around exterior</p>
                  <p className="text-xs text-orange-600">Capture all body panels, wheels, and glass</p>
                  <div className="space-y-3">
                    <input 
                      type="file" 
                      accept="video/*" 
                      className="hidden" 
                      id="walkaround-video" 
                      capture="environment"
                      onChange={async (e) => {
                        if (e.target.files && e.target.files.length > 0 && activeInspection) {
                          const file = e.target.files[0];
                          console.log('Inspector portal walkaround video selected:', file.name, file.type);
                          console.log('Video size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
                          
                          // Show loading message with video size
                          const loadingToast = toast({
                            title: "Uploading walkaround video...",
                            description: `Processing ${(file.size / 1024 / 1024).toFixed(1)}MB video. This may take a moment.`,
                          });
                          
                          const formData = new FormData();
                          formData.append("files", file);
                          
                          try {
                            const res = await fetch(`/api/inspections/${activeInspection.id}/uploads`, {
                              method: 'POST',
                              body: formData,
                            });
                            const data = await res.json();
                            console.log('Inspector portal walkaround video upload response:', data);
                            if (res.ok) {
                              setUploadedFiles(prev => [...prev, file]);
                              setSectionStatus(prev => ({ ...prev, walkaroundVideo: true }));
                              loadingToast.dismiss();
                              toast({
                                title: "Walkaround video uploaded!",
                                description: "Video has been successfully uploaded and optimized",
                              });
                            } else {
                              throw new Error(data.error || 'Upload failed');
                            }
                          } catch (error) {
                            console.error('Inspector portal walkaround video upload error:', error);
                            loadingToast.dismiss();
                            toast({
                              title: "Video upload failed",
                              description: error instanceof Error ? error.message : 'Unknown error',
                              variant: "destructive",
                            });
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      className="w-full bg-green-50 text-green-700 border-green-300 hover:bg-green-100"
                      onClick={() => document.getElementById('walkaround-video')?.click()}
                    >
                      <Video className="h-5 w-5 mr-2" />
                      🎥 Record Walkaround
                    </Button>
                    <p className="text-xs text-gray-500 text-center">Tap to open camera and record video</p>
                  </div>
                </div>

                {/* Engine Video */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center">
                    <Video className="h-4 w-4 mr-2 text-red-600" />
                    Engine Running Video
                    {sectionStatus.engineVideo && <span className="ml-2 text-green-600">✓</span>}
                  </h4>
                  <p className="text-sm text-gray-500">Record running engine and verify HVAC operation</p>
                  <p className="text-xs text-orange-600">Show A/C and heat functioning</p>
                  <div className="space-y-3">
                    <input 
                      type="file" 
                      accept="video/*" 
                      className="hidden" 
                      id="engine-video" 
                      capture="environment"
                      onChange={async (e) => {
                        if (e.target.files && e.target.files.length > 0 && activeInspection) {
                          const file = e.target.files[0];
                          console.log('Inspector portal engine video selected:', file.name, file.type);
                          console.log('Video size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
                          
                          // Show loading message with video size
                          const loadingToast = toast({
                            title: "Uploading engine video...",
                            description: `Processing ${(file.size / 1024 / 1024).toFixed(1)}MB video. This may take a moment.`,
                          });
                          
                          const formData = new FormData();
                          formData.append("files", file);
                          
                          try {
                            const res = await fetch(`/api/inspections/${activeInspection.id}/uploads`, {
                              method: 'POST',
                              body: formData,
                            });
                            const data = await res.json();
                            console.log('Inspector portal engine video upload response:', data);
                            if (res.ok) {
                              setUploadedFiles(prev => [...prev, file]);
                              setSectionStatus(prev => ({ ...prev, engineVideo: true }));
                              loadingToast.dismiss();
                              toast({
                                title: "Engine video uploaded!",
                                description: "Video has been successfully uploaded and optimized",
                              });
                            } else {
                              throw new Error(data.error || 'Upload failed');
                            }
                          } catch (error) {
                            console.error('Inspector portal engine video upload error:', error);
                            loadingToast.dismiss();
                            toast({
                              title: "Video upload failed",
                              description: error instanceof Error ? error.message : 'Unknown error',
                              variant: "destructive",
                            });
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      className="w-full bg-red-50 text-red-700 border-red-300 hover:bg-red-100"
                      onClick={() => document.getElementById('engine-video')?.click()}
                    >
                      <Video className="h-5 w-5 mr-2" />
                      🎥 Record Engine
                    </Button>
                    <p className="text-xs text-gray-500 text-center">Tap to open camera and record engine video</p>
                  </div>
                </div>

                {/* Cosmetic Estimate */}
                <div className="space-y-3">
                  <h4 className="font-medium">Cosmetic Condition Estimate</h4>
                  <div className="grid gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="cosmetic-estimate">Cosmetic Repair Estimate ($)</Label>
                      <input
                        id="cosmetic-estimate"
                        type="number"
                        placeholder="Enter estimate amount"
                        value={cosmeticEstimate}
                        onChange={(e) => {
                          setCosmeticEstimate(e.target.value);
                          // Mark cosmetics section complete if both estimate and details are filled
                          if (e.target.value && cosmeticDetails) {
                            setSectionStatus(prev => ({ ...prev, cosmetics: true }));
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cosmetic-details">Details</Label>
                      <Textarea
                        id="cosmetic-details"
                        placeholder="Enter details about cosmetic issues..."
                        value={cosmeticDetails}
                        onChange={(e) => {
                          setCosmeticDetails(e.target.value);
                          // Mark cosmetics section complete if both estimate and details are filled
                          if (cosmeticEstimate && e.target.value) {
                            setSectionStatus(prev => ({ ...prev, cosmetics: true }));
                          }
                        }}
                        className="min-h-[80px]"
                      />
                    </div>
                  </div>
                </div>

                {/* Mechanical Estimate */}
                <div className="space-y-3">
                  <h4 className="font-medium">Mechanical Condition Estimate</h4>
                  <div className="grid gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="mechanical-estimate">Mechanical Repair Estimate ($)</Label>
                      <input
                        id="mechanical-estimate"
                        type="number"
                        placeholder="Enter estimate amount"
                        value={mechanicalEstimate}
                        onChange={(e) => {
                          setMechanicalEstimate(e.target.value);
                          // Mark mechanical section complete if both estimate and details are filled
                          if (e.target.value && mechanicalDetails) {
                            setSectionStatus(prev => ({ ...prev, mechanical: true }));
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mechanical-details">Details</Label>
                      <Textarea
                        id="mechanical-details"
                        placeholder="Enter details about mechanical issues..."
                        value={mechanicalDetails}
                        onChange={(e) => {
                          setMechanicalDetails(e.target.value);
                          // Mark mechanical section complete if both estimate and details are filled
                          if (mechanicalEstimate && e.target.value) {
                            setSectionStatus(prev => ({ ...prev, mechanical: true }));
                          }
                        }}
                        className="min-h-[80px]"
                      />
                    </div>
                  </div>
                </div>

                {/* Total Repair Estimate */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">Total Repair Estimate</h4>
                  <div className="text-2xl font-bold text-blue-900">
                    ${((parseFloat(cosmeticEstimate) || 0) + (parseFloat(mechanicalEstimate) || 0)).toLocaleString()}
                  </div>
                  <div className="text-sm text-blue-600 mt-1">
                    Cosmetic: ${(parseFloat(cosmeticEstimate) || 0).toLocaleString()} + 
                    Mechanical: ${(parseFloat(mechanicalEstimate) || 0).toLocaleString()}
                  </div>
                </div>

                {/* Voice Notes */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center">
                    <Mic className="h-4 w-4 mr-2 text-purple-600" />
                    Voice Notes
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className={`flex items-center gap-2 ${isRecording ? 'bg-red-50 text-red-700 border-red-300' : ''}`}
                        onClick={isRecording ? stopRecording : startRecording}
                      >
                        <Mic className="h-4 w-4" />
                        {isRecording ? 'Stop Recording' : 'Record Voice Note'}
                      </Button>
                      <span className="text-sm text-gray-500">
                        {isRecording ? 'Recording... Tap to stop' : 'Record audio observations'}
                      </span>
                    </div>
                    {voiceNote && (
                      <div className="p-3 bg-gray-50 rounded border space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-green-600">✓ Voice note recorded</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const audio = new Audio(URL.createObjectURL(voiceNote));
                              audio.play();
                            }}
                            className="text-purple-600 border-purple-300 hover:bg-purple-50"
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Play
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Upload Status Section - Enhanced */}
            {uploadedFiles.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-800 mb-3 flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Uploaded Media ({uploadedFiles.length})
                </h4>
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => {
                    const isVideo = file.type.startsWith('video/');
                    const isWalkaround = file.name.toLowerCase().includes('walkaround') || 
                                       (isVideo && uploadedFiles.filter(f => f.type.startsWith('video/')).indexOf(file) === 0);
                    const isEngine = file.name.toLowerCase().includes('engine') || 
                                   (isVideo && uploadedFiles.filter(f => f.type.startsWith('video/')).indexOf(file) === 1);
                    
                    return (
                      <div key={index} className="flex items-center justify-between p-2 bg-white rounded border border-green-100">
                        <div className="flex items-center flex-1">
                          {isVideo ? (
                            <Video className="h-4 w-4 mr-2 text-green-600" />
                          ) : (
                            <Camera className="h-4 w-4 mr-2 text-blue-600" />
                          )}
                          <div className="text-sm">
                            <div className="font-medium text-gray-700">
                              {isVideo ? (
                                isWalkaround ? '🚶 Walkaround Video' : 
                                isEngine ? '🔧 Engine Video' : 
                                'Video'
                              ) : 'Photo'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {file.name} • {(file.size / 1024 / 1024).toFixed(1)}MB
                            </div>
                          </div>
                        </div>
                        {isVideo && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const url = URL.createObjectURL(file);
                              const video = document.createElement('video');
                              video.src = url;
                              video.controls = true;
                              video.style.maxWidth = '100%';
                              video.style.maxHeight = '400px';
                              
                              const dialog = document.createElement('div');
                              dialog.style.position = 'fixed';
                              dialog.style.top = '0';
                              dialog.style.left = '0';
                              dialog.style.right = '0';
                              dialog.style.bottom = '0';
                              dialog.style.backgroundColor = 'rgba(0,0,0,0.8)';
                              dialog.style.display = 'flex';
                              dialog.style.alignItems = 'center';
                              dialog.style.justifyContent = 'center';
                              dialog.style.zIndex = '9999';
                              dialog.onclick = () => document.body.removeChild(dialog);
                              
                              dialog.appendChild(video);
                              document.body.appendChild(dialog);
                            }}
                            className="text-green-600 hover:bg-green-50"
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Preview
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Inspection Notes */}
            <div className="space-y-3">
              <Label htmlFor="inspection-notes" className="text-base font-medium">
                Inspection Notes
              </Label>
              <Textarea
                id="inspection-notes"
                placeholder="Enter detailed notes about the vehicle condition, any damages, mechanical issues, or other observations..."
                value={inspectionNotes}
                onChange={(e) => {
                  setInspectionNotes(e.target.value);
                  // Mark notes section complete if notes are entered
                  if (e.target.value || voiceNote) {
                    setSectionStatus(prev => ({ ...prev, notes: true }));
                  } else {
                    setSectionStatus(prev => ({ ...prev, notes: false }));
                  }
                }}
                className="min-h-[120px]"
              />
            </div>

            {/* Recommendation Toggle */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-green-800">Dealer Recommendation</h4>
                  <p className="text-sm text-green-600 mt-1">Click to mark this vehicle as recommended</p>
                </div>
                <Button
                  type="button"
                  variant={isRecommended ? "default" : "outline"}
                  size="lg"
                  onClick={() => setIsRecommended(!isRecommended)}
                  className={`min-w-[140px] ${
                    isRecommended 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {isRecommended ? (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Recommended
                    </>
                  ) : (
                    'Recommend'
                  )}
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
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
                variant="outline"
                onClick={() => setShowSkipDialog(true)}
                className="flex-1 text-orange-600 border-orange-600 hover:bg-orange-50"
              >
                <X className="h-4 w-4 mr-2" />
                Skip/Pass
              </Button>
              
              <Button
                onClick={() => {
                  if (activeInspection) {
                    completeInspectionMutation.mutate(activeInspection.id);
                  }
                }}
                disabled={
                  completeInspectionMutation.isPending || 
                  !inspectionNotes.trim() ||
                  uploadedFiles.length === 0 ||
                  !cosmeticEstimate ||
                  !mechanicalEstimate
                }
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50"
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

      {/* Skip/Pass Dialog */}
      <Dialog open={showSkipDialog} onOpenChange={setShowSkipDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <X className="h-5 w-5 mr-2 text-orange-500" />
              Skip this inspection?
            </DialogTitle>
            <DialogDescription>
              Please provide a reason and photo documentation for skipping this vehicle inspection.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 my-4">
            <div className="space-y-2">
              <Label htmlFor="skip-reason">Reason for skipping</Label>
              <Select value={skipReason} onValueChange={setSkipReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NOS">NOS (Not On Spot)</SelectItem>
                  <SelectItem value="Cosmetics Out of Range">Cosmetics Out of Range</SelectItem>
                  <SelectItem value="Mechanical Out of Range">Mechanical Out of Range</SelectItem>
                  <SelectItem value="Damage Too Severe">Damage Too Severe</SelectItem>
                  <SelectItem value="Other">Other (Please explain)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="skip-note">Explanation</Label>
              <Textarea 
                id="skip-note" 
                value={skipNote} 
                onChange={(e) => setSkipNote(e.target.value)}
                placeholder="Please provide details about why you're skipping this inspection..."
                className="min-h-[80px]"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="skip-photo">Required Photo</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="skip-photo"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSkipPhoto(file);
                      toast({
                        title: "Photo Selected",
                        description: "Photo ready for upload with skip reason",
                      });
                    }
                  }}
                  required
                />
                <label htmlFor="skip-photo" className="cursor-pointer">
                  <div className="space-y-2">
                    <Camera className="h-8 w-8 mx-auto text-gray-400" />
                    <p className="text-sm font-medium">
                      {skipPhoto ? skipPhoto.name : "Upload Photo"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {skipPhoto ? "Photo selected" : "Required: Photo showing reason for skip"}
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button 
              variant="ghost" 
              onClick={() => {
                setShowSkipDialog(false);
                setSkipReason("");
                setSkipNote("");
                setSkipPhoto(null);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => skipInspectionMutation.mutate()}
              disabled={skipInspectionMutation.isPending || !skipReason || !skipNote || !skipPhoto}
              className="flex-1"
            >
              {skipInspectionMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <X className="h-4 w-4 mr-2" />
              )}
              Confirm Skip
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}