import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { ColumnMappingModal } from "@/components/modals/column-mapping-modal";

export function RunlistUploadWithMapping() {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [auctionId, setAuctionId] = useState<string>("");
  const [inspectionDate, setInspectionDate] = useState<Date | undefined>(new Date());
  const [showColumnMapping, setShowColumnMapping] = useState(false);
  const [uploadedRunlistId, setUploadedRunlistId] = useState<number | null>(null);
  const [sampleColumns, setSampleColumns] = useState<string[]>([]);
  
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/runlists/upload", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload runlist");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      if (data.needs_mapping) {
        // If the file was uploaded but needs column mapping
        setUploadedRunlistId(data.runlist.id);
        setSampleColumns(extractColumnNames(data.sample_record || {}));
        setShowColumnMapping(true);
        
        toast({
          title: "File uploaded successfully",
          description: "Please map the columns from your file to process the data.",
        });
      } else {
        // If the file was uploaded and processed successfully
        toast({
          title: "Runlist uploaded and processed",
          description: `Processed ${data.vehicle_count} vehicles with ${data.match_count} matches found.`,
        });
        
        queryClient.invalidateQueries({ queryKey: ["/api/runlists"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
        
        // Reset form state
        resetForm();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Function to extract column names from a sample record
  const extractColumnNames = (record: Record<string, any>): string[] => {
    return Object.keys(record);
  };

  const handleUpload = () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload.",
        variant: "destructive"
      });
      return;
    }

    if (!auctionId) {
      toast({
        title: "Auction required",
        description: "Please select an auction for this runlist.",
        variant: "destructive"
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("auctionId", auctionId);
    
    if (inspectionDate) {
      formData.append("inspectionDate", inspectionDate.toISOString());
    }
    
    uploadMutation.mutate(formData);
  };

  const resetForm = () => {
    setFile(null);
    setAuctionId("");
    setInspectionDate(new Date());
    setShowColumnMapping(false);
    setUploadedRunlistId(null);
    setSampleColumns([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Upload New Runlist</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="auction">Auction</Label>
              <Select value={auctionId} onValueChange={setAuctionId}>
                <SelectTrigger id="auction">
                  <SelectValue placeholder="Select an auction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Manheim Auto Auction</SelectItem>
                  <SelectItem value="2">ADESA Auto Auction</SelectItem>
                  <SelectItem value="3">Copart Auto Auction</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="inspectionDate">Inspection Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !inspectionDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {inspectionDate ? format(inspectionDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={inspectionDate}
                    onSelect={setInspectionDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="file">Runlist File (CSV)</Label>
              <Input
                id="file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
              />
              <p className="text-xs text-muted-foreground">
                You'll be able to map columns after uploading. Only .csv files are supported.
              </p>
            </div>
            
            <Button
              type="button"
              onClick={handleUpload}
              disabled={uploadMutation.isPending || !file || !auctionId}
              className="w-full"
            >
              {uploadMutation.isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Uploading...
                </>
              ) : (
                "Upload Runlist"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Column Mapping Modal */}
      {showColumnMapping && uploadedRunlistId && auctionId && (
        <ColumnMappingModal
          open={showColumnMapping}
          onClose={() => {
            setShowColumnMapping(false);
            queryClient.invalidateQueries({ queryKey: ["/api/runlists"] });
            resetForm();
          }}
          runlistId={uploadedRunlistId}
          auctionId={parseInt(auctionId)}
          availableColumns={sampleColumns}
        />
      )}
    </>
  );
}