import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowLeft,
  Car,
  Check,
  Loader2,
  MapPin,
  Mic,
  Square,
  User,
  X,
} from "lucide-react";
import { FileUpload } from "@/components/file-upload-new";
import { queryClient, apiRequest } from "@/lib/queryClient";

// Reusable component for viewing completed inspection results
const InspectionResultView = ({ inspectionResult }: { inspectionResult: any }) => {
  // If there's no result yet, provide a simple view
  if (!inspectionResult) {
    return (
      <div className="space-y-8">
        <div className="border rounded-md p-4 bg-gray-50">
          <h3 className="text-lg font-medium mb-3">Inspection Media</h3>
          <p className="text-sm text-gray-500">
            View inspection photos and videos in the Inspection Results page.
          </p>
          <Button
            className="mt-4"
            onClick={() => window.location.href = "/inspection-results"}
          >
            View Full Results
          </Button>
        </div>
      </div>
    );
  }
  
  console.log("Rendering inspection result:", inspectionResult);
  
  // Use actual photos and videos from the inspection result
  const photos = inspectionResult.photos || [];
  const videos = inspectionResult.videos || [];
  const audioNotes = inspectionResult.audio_notes || [];
  
  return (
    <div className="space-y-8">
      {/* Photos Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Photos</h3>
        {photos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {photos.map((photo: string, index: number) => (
              <div key={index} className="relative overflow-hidden rounded-lg border bg-background">
                <img 
                  src={photo} 
                  alt={`Photo ${index + 1}`} 
                  className="h-40 w-full object-cover cursor-pointer"
                  onClick={() => window.open(photo, '_blank')}
                />
                <div className="p-2 text-sm">
                  Photo {index + 1}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-500">No photos available</div>
        )}
      </div>

      {/* Videos Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Videos</h3>
        {videos.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {videos.map((video: string, index: number) => (
              <div key={index} className="overflow-hidden rounded-lg border bg-background">
                <video 
                  controls 
                  className="w-full"
                  src={video}
                />
                <div className="p-2 text-sm">
                  Video {index + 1}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-500">No videos available</div>
        )}
      </div>

      {/* Module Scan Links Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Module Scan Links</h3>
        {inspectionResult.links && inspectionResult.links.length > 0 ? (
          <div className="space-y-3">
            {inspectionResult.links.map((link: any, index: number) => (
              <div key={index} className="border rounded-lg p-4 bg-purple-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{link.label || "Module Scan Report"}</p>
                    <p className="text-xs text-gray-500">
                      {link.created_at ? `Added: ${new Date(link.created_at).toLocaleDateString()}` : "Module scan diagnostic report"}
                    </p>
                  </div>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 flex items-center"
                  >
                    📊 View Report
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : inspectionResult.data?.module_scan_link ? (
          <div className="border rounded-lg p-4 bg-purple-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Module Scan Report</p>
                <p className="text-xs text-gray-500">Module scan diagnostic report</p>
              </div>
              <a
                href={inspectionResult.data.module_scan_link}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 flex items-center"
              >
                📊 View Report
              </a>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500">No module scan links available</div>
        )}
      </div>

      {/* Voice Notes Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Voice Notes</h3>
        {audioNotes && audioNotes.length > 0 ? (
          <div className="rounded-md border">
            <div className="p-4 space-y-4">
              {audioNotes.map((audioFile: string, index: number) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Mic className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Voice Note {index + 1}</span>
                  </div>
                  <div className="flex flex-col gap-2 pl-6">
                    <audio 
                      src={`/uploads/${audioFile}`} 
                      controls 
                      className="w-full max-w-md"
                    />
                    <div className="rounded-md bg-muted p-3">
                      <p className="text-sm text-muted-foreground italic">
                        Audio transcription not available
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500">No voice notes available</div>
        )}
      </div>
      
      <div className="flex justify-center">
        <Button
          onClick={() => window.location.href = "/inspection-results"}
          variant="outline"
        >
          View All Inspection Results
        </Button>
      </div>
    </div>
  );
};

export default function InspectionDetail() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  // Extract inspection ID from URL
  const id = window.location.pathname.split("/").pop();
  
  if (!id) {
    navigate("/inspections");
    return null;
  }
  
  // State for inspection form
  const [photos, setPhotos] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [moduleScanLink, setModuleScanLink] = useState<string>("");
  
  // State for voice recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingInterval, setRecordingInterval] = useState<NodeJS.Timeout | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");
  const recognitionRef = useRef<any>(null);
  
  // State for skip dialog
  const [skipDialogOpen, setSkipDialogOpen] = useState(false);
  const [skipReason, setSkipReason] = useState("");
  const [skipExplanation, setSkipExplanation] = useState("");
  
  // State for decoded VIN info
  const [decodedVehicleInfo, setDecodedVehicleInfo] = useState<any>(null);

  // Tab state management for deep linking
  const [activeTab, setActiveTab] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('tab') || 'photos';
  });

  // Auto-save key for localStorage
  const autoSaveKey = `inspection_draft_${id}`;

  // Load saved data on component mount
  useEffect(() => {
    const savedData = localStorage.getItem(autoSaveKey);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.photos) setPhotos(parsed.photos);
        if (parsed.videos) setVideos(parsed.videos);
        if (parsed.moduleScanLink) setModuleScanLink(parsed.moduleScanLink);
        if (parsed.transcribedText) setTranscribedText(parsed.transcribedText);
        if (parsed.activeTab) setActiveTab(parsed.activeTab);
      } catch (error) {
        console.error('Failed to load saved inspection data:', error);
      }
    }
  }, [id]);

  // Auto-save to localStorage whenever data changes
  useEffect(() => {
    const dataToSave = {
      photos,
      videos,
      moduleScanLink,
      transcribedText,
      activeTab,
      lastSaved: new Date().toISOString()
    };
    localStorage.setItem(autoSaveKey, JSON.stringify(dataToSave));
  }, [photos, videos, moduleScanLink, transcribedText, activeTab, autoSaveKey]);

  // Update URL when tab changes for deep linking
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', value);
    window.history.replaceState({}, '', url.toString());
  };

  // Clear saved data when inspection is completed
  const clearSavedData = () => {
    localStorage.removeItem(autoSaveKey);
  };
  
  // Fetch inspection data
  const { data: inspection, isLoading } = useQuery({
    queryKey: [`/api/inspections/${id}`],
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });
  
  // Fetch vehicle data
  const { data: vehicle } = useQuery({
    queryKey: [`/api/vehicles/${inspection?.vehicle_id}`],
    enabled: !!inspection?.vehicle_id,
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });
  
  // Fetch dealer data
  const { data: dealer } = useQuery({
    queryKey: [`/api/dealers/${inspection?.dealer_id}`],
    enabled: !!inspection?.dealer_id,
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });
  
  // Fetch inspector data
  const { data: inspector } = useQuery({
    queryKey: [`/api/inspectors/${inspection?.inspector_id}`],
    enabled: !!inspection?.inspector_id,
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });
  
  // Fetch auction data via runlist
  const { data: runlist } = useQuery({
    queryKey: [`/api/runlists/${vehicle?.runlist_id}`],
    enabled: !!vehicle?.runlist_id,
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });
  
  // Fetch auction data
  const { data: auction } = useQuery({
    queryKey: [`/api/auctions/${runlist?.auction_id}`],
    enabled: !!runlist?.auction_id,
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });
  
  // Fetch inspection result if completed
  const { data: inspectionResult } = useQuery({
    queryKey: [`/api/inspection-results/${id}`],
    enabled: inspection?.status === "completed",
    refetchInterval: false,
    refetchOnWindowFocus: false,
    retry: false, // Don't retry on 404
    onSuccess: (data) => {
      console.log("Inspection Result Data:", data);
    },
    onError: (error) => {
      console.log("No inspection result found, will use fallback");
    }
  });

  // Fallback: fetch all inspection results and find by inspection_id
  const { data: allResults } = useQuery({
    queryKey: ["/api/inspection-results"],
    enabled: inspection?.status === "completed" && !inspectionResult,
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  // Find the result for this inspection from the all results
  const fallbackResult = allResults?.find((result: any) => result.inspection_id === parseInt(id));

  // Use the direct result if available, otherwise use fallback
  const finalInspectionResult = inspectionResult || fallbackResult;
  
  // Mutation to decode VIN
  const decodeVinMutation = useMutation({
    mutationFn: async (vin: string) => {
      const res = await apiRequest("GET", `/api/vin-decode?vin=${vin}`);
      return await res.json();
    },
    onSuccess: (data) => {
      setDecodedVehicleInfo(data);
      toast({
        title: "VIN Decoded",
        description: "Vehicle information has been updated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "VIN Decode Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation to upload photos
  const uploadPhotosMutation = useMutation({
    mutationFn: async (files: FileList) => {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append("files", file);
      });
      
      const res = await apiRequest("POST", `/api/inspections/${id}/uploads`, formData);
      return await res.json();
    },
    onSuccess: (data) => {
      // Extract photo files only (filter by type image)
      const photoFiles = data.files.filter((file: any) => file.type === 'photo').map((file: any) => file.url);
      setPhotos(prev => [...prev, ...photoFiles]);
      toast({
        title: "Photos Uploaded",
        description: `Successfully uploaded ${photoFiles.length} photos`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation to upload videos
  const uploadVideosMutation = useMutation({
    mutationFn: async (files: FileList) => {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append("files", file);
      });
      
      const res = await apiRequest("POST", `/api/inspections/${id}/uploads`, formData);
      return await res.json();
    },
    onSuccess: (data) => {
      // Extract video files only (filter by type video)
      const videoFiles = data.files.filter((file: any) => file.type === 'video').map((file: any) => file.url);
      setVideos(prev => [...prev, ...videoFiles]);
      toast({
        title: "Videos Uploaded",
        description: `Successfully uploaded ${videoFiles.length} videos`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation to upload voice notes
  const uploadVoiceNoteMutation = useMutation({
    mutationFn: async (audioBlob: Blob) => {
      const formData = new FormData();
      formData.append("files", audioBlob, `voice-note-${Date.now()}.webm`);
      
      const res = await apiRequest("POST", `/api/inspections/${id}/uploads`, formData);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Voice Note Saved",
        description: `Voice note uploaded successfully (${(data.files[0]?.size / 1024 / 1024).toFixed(1)}MB)`,
      });
      // Refresh inspection result to show the new voice note
      queryClient.invalidateQueries([`/api/inspection-results/${id}`]);
      queryClient.invalidateQueries(["/api/inspection-results"]);
    },
    onError: (error: Error) => {
      toast({
        title: "Voice Note Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation to complete inspection
  const completeInspectionMutation = useMutation({
    mutationFn: async () => {
      const inspectionData = {
        photos: photos,
        videos: videos,
        module_scan_link: moduleScanLink,
      };
      
      const res = await apiRequest("POST", `/api/inspections/${id}/complete`, inspectionData);
      return await res.json();
    },
    onSuccess: () => {
      clearSavedData(); // Clear auto-saved data when inspection is completed
      toast({
        title: "Inspection Completed",
        description: "The inspection has been successfully completed",
      });
      navigate("/inspector-dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Completion Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation to skip inspection
  const skipInspectionMutation = useMutation({
    mutationFn: async () => {
      const skipData = {
        reason: skipReason,
        explanation: skipReason === "Other" ? skipExplanation : "",
      };
      
      const res = await apiRequest("POST", `/api/inspections/${id}/skip`, skipData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Inspection Skipped",
        description: "This vehicle has been passed for inspection",
      });
      setSkipDialogOpen(false);
      navigate("/inspector-dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Skip Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Load existing photos and videos when inspection is loaded
  useEffect(() => {
    if (inspection && inspection.inspection_result) {
      if (inspection.inspection_result.photos) {
        setPhotos(inspection.inspection_result.photos);
      }
      if (inspection.inspection_result.videos) {
        setVideos(inspection.inspection_result.videos);
      }
    }
  }, [inspection]);
  
  // Handle photo upload success
  const handlePhotoUploadSuccess = (response: any) => {
    // Extract photo URLs from the response
    const photoUrls = response.files
      .filter((file: any) => file.type === 'photo')
      .map((file: any) => file.url);
    setPhotos(prev => [...prev, ...photoUrls]);
    
    // Refresh inspection result to show in completed view
    queryClient.invalidateQueries({ queryKey: [`/api/inspection-results/${id}`] });
    queryClient.invalidateQueries({ queryKey: ["/api/inspection-results"] });
  };
  
  // Handle video upload success
  const handleVideoUploadSuccess = (response: any) => {
    // Extract video URLs from the response
    const videoUrls = response.files
      .filter((file: any) => file.type === 'video')
      .map((file: any) => file.url);
    setVideos(prev => [...prev, ...videoUrls]);
    
    // Refresh inspection result to show in completed view
    queryClient.invalidateQueries({ queryKey: [`/api/inspection-results/${id}`] });
    queryClient.invalidateQueries({ queryKey: ["/api/inspection-results"] });
  };
  
  // Remove photo
  const removePhoto = (filename: string) => {
    setPhotos(photos.filter(p => p !== filename));
  };
  
  // Remove video
  const removeVideo = (filename: string) => {
    setVideos(videos.filter(v => v !== filename));
  };
  
  // Voice recording functionality with speech-to-text
  const startRecording = async () => {
    try {
      // Check for speech recognition support
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        toast({
          title: "Speech Recognition Not Supported",
          description: "Your browser doesn't support speech recognition. Recording audio only.",
          variant: "destructive",
        });
        // Fall back to audio recording only
        return startAudioRecording();
      }
      
      // Start speech recognition
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      
      let finalTranscript = '';
      
      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        
        setTranscribedText(finalTranscript + interimTranscript);
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        toast({
          title: "Transcription Error",
          description: "Speech recognition failed. Audio will still be recorded.",
          variant: "destructive",
        });
      };
      
      recognitionRef.current.onend = () => {
        if (finalTranscript.trim()) {
          // Voice notes are now handled separately - transcribed text is processed but not stored in removed sections
          
          toast({
            title: "Voice Note Transcribed",
            description: "Your speech has been converted to text and added to inspection notes.",
          });
        }
        setIsTranscribing(false);
      };
      
      // Start both speech recognition and audio recording
      recognitionRef.current.start();
      setIsTranscribing(true);
      await startAudioRecording();
      
    } catch (err) {
      console.error("Error starting recording:", err);
      toast({
        title: "Recording Failed",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };
  
  const startAudioRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    audioChunksRef.current = [];
    
    mediaRecorderRef.current.ondataavailable = (e) => {
      audioChunksRef.current.push(e.data);
    };
    
    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      uploadVoiceNoteMutation.mutate(audioBlob);
      
      // Stop all tracks on the stream to release the microphone
      stream.getTracks().forEach(track => track.stop());
    };
    
    mediaRecorderRef.current.start();
    setIsRecording(true);
    
    // Set up timer
    setRecordingTime(0);
    const interval = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
    setRecordingInterval(interval);
  };
  
  const stopRecording = () => {
    // Stop speech recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    // Stop audio recording
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Clear interval
      if (recordingInterval) {
        clearInterval(recordingInterval);
        setRecordingInterval(null);
      }
    }
  };
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recordingInterval) {
        clearInterval(recordingInterval);
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isRecording, recordingInterval]);
  
  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Error state if inspection not found
  if (!inspection) {
    return (
      <div className="container mx-auto py-12">
        <Card>
          <CardHeader>
            <CardTitle>Inspection Not Found</CardTitle>
            <CardDescription>
              The inspection you're looking for doesn't exist or you don't have permission to view it.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate("/inspections")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Inspections
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Helper function to format date
  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy h:mm a");
    } catch (e) {
      return "Invalid date";
    }
  };
  
  // Check if inspection is in completed state
  const isCompletedInspection = inspection.status === "completed";
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(isCompletedInspection ? "/inspection-results" : "/inspector-dashboard")}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">
            {isCompletedInspection ? "Inspection Result" : "Inspection Form"}
          </h1>
          <Badge className={`ml-3 ${isCompletedInspection ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}`}>
            {isCompletedInspection ? "Completed" : "In Progress"}
          </Badge>
          {!isCompletedInspection && (
            <div className="ml-3 text-xs text-gray-500 bg-green-50 px-2 py-1 rounded flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
              Auto-saved
            </div>
          )}
        </div>
        {!isCompletedInspection && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setSkipDialogOpen(true)}
              disabled={skipInspectionMutation.isPending}
            >
              {skipInspectionMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <X className="h-4 w-4 mr-2" />
              )}
              Pass/Skip
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
        )}
      </div>
      
      {/* Skip/Pass Dialog */}
      <Dialog open={skipDialogOpen} onOpenChange={setSkipDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
              Pass on this inspection?
            </DialogTitle>
            <DialogDescription>
              Select a reason for skipping this inspection. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 my-2">
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
                  <SelectItem value="Other">Other (Please explain)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {skipReason === "Other" && (
              <div className="space-y-2">
                <Label htmlFor="skip-explanation">Explanation</Label>
                <Textarea 
                  id="skip-explanation" 
                  value={skipExplanation} 
                  onChange={(e) => setSkipExplanation(e.target.value)}
                  placeholder="Please provide details about why you're skipping this inspection..."
                  className="min-h-[100px]"
                />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSkipDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => skipInspectionMutation.mutate()}
              disabled={skipInspectionMutation.isPending || !skipReason}
            >
              {skipInspectionMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <X className="h-4 w-4 mr-2" />
              )}
              Confirm Skip
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Prominent Notes Display */}
      {inspection.notes && inspection.notes.trim() !== "" && inspection.notes !== "Created via batch upload" && (
        <Card className="border-amber-200 bg-amber-50 mb-6">
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
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left side - Vehicle & Inspection Details */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Car className="h-5 w-5 mr-2 text-primary" />
                Vehicle Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                {/* Vehicle name and title */}
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-medium">
                    {decodedVehicleInfo ? 
                      `${decodedVehicleInfo.year} ${decodedVehicleInfo.make} ${decodedVehicleInfo.model} ${decodedVehicleInfo.trim || ""}` : 
                      (vehicle && vehicle.year && vehicle.make && vehicle.model) ? 
                        `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim || ""}` : 
                        "Vehicle Details"
                    }
                  </h3>
                  {vehicle && vehicle.vin && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-xs"
                      onClick={() => decodeVinMutation.mutate(vehicle.vin)}
                      disabled={decodeVinMutation.isPending}
                    >
                      {decodeVinMutation.isPending ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Car className="h-3 w-3 mr-1" />
                      )}
                      Decode VIN
                    </Button>
                  )}
                </div>
                
                {/* Basic vehicle information */}
                <div className="text-sm text-gray-500 mt-3">
                  <div className="flex items-center mt-1">
                    <span className="font-medium mr-2 w-20">VIN:</span> 
                    <span className="font-mono">{vehicle && (vehicle.vin || "N/A")}</span>
                  </div>
                  
                  {/* Show decoded info if available */}
                  {decodedVehicleInfo && (
                    <>
                      <div className="flex items-center mt-1">
                        <span className="font-medium mr-2 w-20">Year:</span> 
                        {decodedVehicleInfo.year || "N/A"}
                      </div>
                      <div className="flex items-center mt-1">
                        <span className="font-medium mr-2 w-20">Make:</span> 
                        {decodedVehicleInfo.make || "N/A"}
                      </div>
                      <div className="flex items-center mt-1">
                        <span className="font-medium mr-2 w-20">Model:</span> 
                        {decodedVehicleInfo.model || "N/A"}
                      </div>
                      {decodedVehicleInfo.trim && (
                        <div className="flex items-center mt-1">
                          <span className="font-medium mr-2 w-20">Trim:</span> 
                          {decodedVehicleInfo.trim}
                        </div>
                      )}
                    </>
                  )}

                  <div className="flex items-center mt-1">
                    <span className="font-medium mr-2 w-20">Stock #:</span> 
                    {vehicle && (vehicle.stock_number || "N/A")}
                  </div>
                  <div className="flex items-center mt-1">
                    <span className="font-medium mr-2 w-20">Mileage:</span> 
                    {vehicle && vehicle.mileage ? `${vehicle.mileage.toLocaleString()} miles` : "N/A"}
                  </div>
                  <div className="flex items-center mt-1">
                    <span className="font-medium mr-2 w-20">Color:</span> 
                    {vehicle && (vehicle.color || "N/A")}
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                  Auction Information
                </h4>
                <div className="text-sm text-gray-500 mt-1">
                  <div className="flex items-center mt-1">
                    <span className="font-medium mr-2">Lane:</span> 
                    {vehicle && (vehicle.lane_number || "N/A")}
                  </div>
                  <div className="flex items-center mt-1">
                    <span className="font-medium mr-2">Run:</span> 
                    {vehicle && (vehicle.run_number || "N/A")}
                  </div>
                  {auction && (
                    <>
                      <div className="flex items-center mt-2">
                        <span className="font-medium mr-2">Auction:</span> 
                        {auction.name}
                      </div>
                      <div className="flex items-center mt-1">
                        <span className="font-medium mr-2">Location:</span> 
                        {auction.location || auction.address || "N/A"}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium flex items-center">
                  <User className="h-4 w-4 mr-2 text-gray-500" />
                  Assigned To
                </h4>
                <div className="text-sm text-gray-500 mt-1">
                  {inspector ? `Inspector #${inspector.id}` : "Unassigned"}
                </div>
                
                {dealer && (
                  <div className="mt-3">
                    <div className="text-sm font-medium">Dealer:</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {dealer.name}
                      {dealer.contact_name && (
                        <div className="text-xs mt-1">Contact: {dealer.contact_name}</div>
                      )}
                    </div>
                  </div>
                )}
                
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right side - Inspection Form or Result */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{isCompletedInspection ? "Inspection Result" : "Inspection Form"}</CardTitle>
              <CardDescription>
                {isCompletedInspection 
                  ? "Review the completed inspection details including photos, videos, and estimates" 
                  : "Complete all required fields for the standardized inspection format"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isCompletedInspection ? (
                <InspectionResultView inspectionResult={finalInspectionResult} />
              ) : (
                /* Inspection Form */
                <ScrollArea className="h-[550px]">
                  <div className="p-1">
                    {/* Quick Upload Actions */}
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="text-sm font-medium mb-2 text-blue-900">Quick Upload</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="file"
                          id="quick-photo-input"
                          accept="image/*"
                          multiple
                          className="hidden"
                          capture="environment"
                          onChange={async (e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              console.log('Quick photos selected:', e.target.files.length);
                              const formData = new FormData();
                              Array.from(e.target.files).forEach(file => {
                                console.log('Adding file:', file.name, file.type);
                                formData.append("files", file);
                              });
                              
                              try {
                                const res = await fetch(`/api/inspections/${id}/uploads`, {
                                  method: 'POST',
                                  body: formData,
                                });
                                const data = await res.json();
                                console.log('Quick upload response:', data);
                                if (res.ok) {
                                  handlePhotoUploadSuccess(data);
                                } else {
                                  throw new Error(data.error || 'Upload failed');
                                }
                              } catch (error) {
                                console.error('Quick upload error:', error);
                                toast({
                                  title: "Upload Failed",
                                  description: error instanceof Error ? error.message : 'Unknown error',
                                  variant: "destructive",
                                });
                              }
                            }
                          }}
                        />
                        <input
                          type="file"
                          id="quick-video-input"
                          accept="video/*"
                          className="hidden"
                          capture="environment"
                          onChange={async (e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              console.log('Quick video selected:', e.target.files[0].name, e.target.files[0].type);
                              const formData = new FormData();
                              formData.append("files", e.target.files[0]);
                              
                              try {
                                const res = await fetch(`/api/inspections/${id}/uploads`, {
                                  method: 'POST',
                                  body: formData,
                                });
                                const data = await res.json();
                                console.log('Quick video upload response:', data);
                                if (res.ok) {
                                  handleVideoUploadSuccess(data);
                                } else {
                                  throw new Error(data.error || 'Upload failed');
                                }
                              } catch (error) {
                                console.error('Quick video upload error:', error);
                                toast({
                                  title: "Upload Failed",
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
                          size="sm"
                          className="bg-white text-blue-700 border-blue-300 hover:bg-blue-100"
                          onClick={() => document.getElementById('quick-photo-input')?.click()}
                        >
                          📷 Photos
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="bg-white text-blue-700 border-blue-300 hover:bg-blue-100"
                          onClick={() => document.getElementById('quick-video-input')?.click()}
                        >
                          🎥 Video
                        </Button>
                      </div>
                    </div>
                    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                      <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="photos" className="text-xs">1. Photos</TabsTrigger>
                        <TabsTrigger value="walkaround" className="text-xs">2. Walkaround</TabsTrigger>
                        <TabsTrigger value="engine" className="text-xs">3. Engine</TabsTrigger>
                        <TabsTrigger value="module-scan" className="text-xs">4. Module Scan</TabsTrigger>
                        <TabsTrigger value="notes" className="text-xs">5. Notes</TabsTrigger>
                      </TabsList>

                      <div className="mt-6">
                        <TabsContent value="photos">
                          <div className="space-y-4">
                            <div>
                              <h3 className="text-lg font-medium">Run/VIN Label Photos</h3>
                              <p className="text-sm font-bold text-gray-800 mb-4 bg-blue-50 p-3 rounded-md border-l-4 border-blue-400">
                                📋 <strong>REQUIRED:</strong> Take clear photos of the vehicle's run label and VIN placard
                              </p>
                              
                              {/* Mobile-friendly photo upload */}
                              <div className="space-y-3">
                                <input
                                  type="file"
                                  id="mobile-photo-input"
                                  accept="image/*"
                                  multiple
                                  className="hidden"
                                  capture="environment"
                                  onChange={async (e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                      console.log('Photos selected:', e.target.files.length);
                                      const formData = new FormData();
                                      Array.from(e.target.files).forEach(file => {
                                        console.log('Adding file:', file.name, file.type);
                                        formData.append("files", file);
                                      });
                                      
                                      try {
                                        const res = await fetch(`/api/inspections/${id}/uploads`, {
                                          method: 'POST',
                                          body: formData,
                                        });
                                        const data = await res.json();
                                        console.log('Upload response:', data);
                                        if (res.ok) {
                                          handlePhotoUploadSuccess(data);
                                        } else {
                                          throw new Error(data.error || 'Upload failed');
                                        }
                                      } catch (error) {
                                        console.error('Upload error:', error);
                                        toast({
                                          title: "Upload Failed",
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
                                  className="w-full h-16 text-lg"
                                  onClick={() => document.getElementById('mobile-photo-input')?.click()}
                                >
                                  📷 Take Photos
                                </Button>
                              </div>
                              
                              {/* Show uploaded photos immediately */}
                              {photos.length > 0 && (
                                <div className="mt-4 grid grid-cols-2 gap-3">
                                  {photos.map((photo, index) => (
                                    <div key={index} className="relative bg-gray-100 rounded-lg overflow-hidden">
                                      <img 
                                        src={photo} 
                                        alt={`Photo ${index + 1}`}
                                        className="w-full h-32 object-cover"
                                        onError={(e) => {
                                          // If Cloudinary URL fails, try local path
                                          const target = e.target as HTMLImageElement;
                                          if (!target.src.includes('/uploads/')) {
                                            target.src = `/uploads/${photo}`;
                                          }
                                        }}
                                      />
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        className="absolute top-1 right-1 h-6 w-6 p-0"
                                        onClick={() => removePhoto(photo)}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1">
                                        Photo {index + 1}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {photos.length > 0 && (
                              <div className="mt-4">
                                <h4 className="text-sm font-medium mb-2">Uploaded Photos:</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                  {photos.map((photo, index) => (
                                    <div key={index} className="relative overflow-hidden rounded-lg border bg-background">
                                      <img 
                                        src={photo.startsWith('http') ? photo : `/uploads/${photo}`} 
                                        alt={`Uploaded photo ${index + 1}`} 
                                        className="h-24 w-full object-cover"
                                      />
                                      <Button
                                        variant="destructive"
                                        size="icon"
                                        className="absolute top-1 right-1 h-6 w-6"
                                        onClick={() => removePhoto(photo)}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </TabsContent>

                        <TabsContent value="walkaround">
                          <div className="space-y-4">
                            <div>
                              <h3 className="text-lg font-medium">Vehicle Walkaround Video</h3>
                              <p className="text-sm font-bold text-gray-800 mb-1 bg-orange-50 p-3 rounded-md border-l-4 border-orange-400">
                                🎥 <strong>REQUIRED:</strong> Record a 1:30-2:00 minute video walking around the exterior of the vehicle
                              </p>
                              <p className="text-sm font-semibold text-orange-700 mb-4 pl-3">
                                ⚠️ Be sure to capture all body panels, wheels, and glass
                              </p>
                              
                              {/* Mobile-friendly video upload */}
                              <div className="space-y-3">
                                <input
                                  type="file"
                                  id="mobile-video-input"
                                  accept="video/*"
                                  className="hidden"
                                  capture="environment"
                                  onChange={async (e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                      console.log('Video selected:', e.target.files[0].name, e.target.files[0].type);
                                      const formData = new FormData();
                                      formData.append("files", e.target.files[0]);
                                      
                                      try {
                                        const res = await fetch(`/api/inspections/${id}/uploads`, {
                                          method: 'POST',
                                          body: formData,
                                        });
                                        const data = await res.json();
                                        console.log('Video upload response:', data);
                                        if (res.ok) {
                                          handleVideoUploadSuccess(data);
                                        } else {
                                          throw new Error(data.error || 'Upload failed');
                                        }
                                      } catch (error) {
                                        console.error('Video upload error:', error);
                                        toast({
                                          title: "Upload Failed",
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
                                  className="w-full h-16 text-lg"
                                  onClick={() => document.getElementById('mobile-video-input')?.click()}
                                >
                                  🎥 Record Video
                                </Button>
                              </div>
                              
                              {/* Show uploaded videos immediately */}
                              {videos.length > 0 && (
                                <div className="mt-4 space-y-3">
                                  {videos.map((video, index) => (
                                    <div key={index} className="relative bg-gray-100 rounded-lg overflow-hidden">
                                      <video 
                                        src={video} 
                                        className="w-full h-48 object-cover"
                                        controls
                                        preload="metadata"
                                        poster=""
                                        onError={(e) => {
                                          const target = e.target as HTMLVideoElement;
                                          if (!target.src.includes('/uploads/')) {
                                            target.src = `/uploads/${video}`;
                                          }
                                        }}
                                      />
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        className="absolute top-2 right-2"
                                        onClick={() => removeVideo(video)}
                                      >
                                        <X className="h-3 w-3 mr-1" />
                                        Remove
                                      </Button>
                                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-sm p-2">
                                        Walkaround Video {index + 1}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {videos.length > 0 && (
                              <div className="mt-4">
                                <h4 className="text-sm font-medium mb-2">Uploaded Videos:</h4>
                                <div className="space-y-3">
                                  {videos.map((video, index) => (
                                    <div key={index} className="relative overflow-hidden rounded-lg border bg-background">
                                      <video 
                                        controls 
                                        className="w-full"
                                        src={video.startsWith('http') ? video : `/uploads/${video}`}
                                      />
                                      <div className="p-2 flex justify-between items-center">
                                        <span className="text-sm">Walkaround Video</span>
                                        <Button
                                          variant="destructive"
                                          size="sm"
                                          onClick={() => removeVideo(video)}
                                        >
                                          <X className="h-3 w-3 mr-1" />
                                          Remove
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </TabsContent>

                        <TabsContent value="engine">
                          <div className="space-y-4">
                            <div>
                              <h3 className="text-lg font-medium">Engine Running Video</h3>
                              <p className="text-sm font-bold text-gray-800 mb-1 bg-green-50 p-3 rounded-md border-l-4 border-green-400">
                                🔧 <strong>REQUIRED:</strong> Record a video of the running engine and verify HVAC operation
                              </p>
                              <p className="text-sm font-semibold text-green-700 mb-4 pl-3">
                                ❄️🔥 Show that the A/C and heat are functioning
                              </p>
                              
                              <FileUpload
                                accept="video/*"
                                endpoint={`/api/inspections/${id}/uploads`}
                                maxFiles={1}
                                maxSize={100}
                                onSuccess={handleVideoUploadSuccess}
                              />
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="module-scan">
                          <div className="space-y-4">
                            <div>
                              <h3 className="text-lg font-medium">Full Module Scan</h3>
                              <p className="text-sm font-bold text-gray-800 mb-4 bg-blue-50 p-3 rounded-md border-l-4 border-blue-400">
                                📊 <strong>OPTIONAL:</strong> Link to module scan report for detailed diagnostic information
                              </p>

                              <div className="space-y-4">
                                <div className="p-4 border rounded-lg bg-white">
                                  <label className="block text-sm font-medium mb-2">Module Scan Report Link</label>
                                  <div className="space-y-3">
                                    <Input
                                      type="url"
                                      placeholder="https://example.com/module-scan-report"
                                      value={moduleScanLink}
                                      onChange={(e) => setModuleScanLink(e.target.value)}
                                      className="w-full"
                                    />
                                    {moduleScanLink && (
                                      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
                                        <div>
                                          <p className="text-sm font-medium text-green-800">Report Link Added</p>
                                          <p className="text-xs text-green-600 truncate max-w-xs">{moduleScanLink}</p>
                                        </div>
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() => window.open(moduleScanLink, '_blank')}
                                        >
                                          View Report
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="text-sm text-gray-500">
                                  <p>The module scan report provides comprehensive diagnostic information including:</p>
                                  <ul className="list-disc list-inside mt-2 space-y-1">
                                    <li>Engine control module data</li>
                                    <li>Transmission diagnostics</li>
                                    <li>ABS and safety system status</li>
                                    <li>Emission control information</li>
                                    <li>Body control module readings</li>
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="notes">
                          <div className="space-y-4">
                            <div>
                              <h3 className="text-lg font-medium">Voice Notes</h3>
                              <p className="text-sm font-bold text-gray-800 mb-4 bg-teal-50 p-3 rounded-md border-l-4 border-teal-400">
                                🎤 <strong>OPTIONAL:</strong> Record voice notes that will be automatically transcribed
                              </p>
                              
                              <div className="flex flex-col items-center justify-center border rounded-md p-6 bg-gray-50">
                                <div className="mb-4 text-center">
                                  <Button
                                    type="button"
                                    onClick={isRecording ? stopRecording : startRecording}
                                    className={cn(
                                      "rounded-full h-16 w-16 flex items-center justify-center",
                                      isRecording ? "bg-red-500 hover:bg-red-600 animate-pulse" : "bg-primary"
                                    )}
                                    disabled={uploadVoiceNoteMutation.isPending}
                                  >
                                    {uploadVoiceNoteMutation.isPending ? (
                                      <Loader2 className="h-6 w-6 animate-spin" />
                                    ) : isRecording ? (
                                      <Square className="h-6 w-6" />
                                    ) : (
                                      <Mic className="h-6 w-6" />
                                    )}
                                  </Button>
                                  <p className="mt-2 text-sm font-medium">
                                    {uploadVoiceNoteMutation.isPending ? "Saving..." :
                                     isRecording ? "Stop Recording" : "Start Recording"}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {isRecording ? formatTime(recordingTime) : "Tap to record a voice note"}
                                  </p>
                                </div>
                                
                                {/* Real-time transcription display */}
                                {(isTranscribing || transcribedText) && (
                                  <div className="w-full mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
                                    <p className="text-xs font-medium text-blue-800 mb-1">
                                      {isTranscribing ? "🎤 Listening..." : "✓ Transcribed"}
                                    </p>
                                    <p className="text-sm text-blue-900">
                                      {transcribedText || "Speak now to see your words appear here..."}
                                    </p>
                                  </div>
                                )}
                                
                                <div className="w-full mt-4">
                                  <p className="text-xs text-center text-gray-500">
                                    {isRecording ? "Recording & transcribing in real-time..." : 
                                     "Voice notes are automatically transcribed and added to inspection details"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </TabsContent>
                      </div>
                    </Tabs>
                  </div>
                </ScrollArea>
              )}
            </CardContent>
            {!isCompletedInspection && (
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/inspector-dashboard")}
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
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

// Format seconds to MM:SS format
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}