import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Upload, AlertCircle, FileUp, Info } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Auction, Inspector } from "@/lib/types";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { DatePicker } from "@/components/ui/date-picker";

// Schema for manual inspection batch upload
const manualInspectionBatchSchema = z.object({
  inspector_id: z.string(),
  auction_id: z.string().min(1, "Auction is required"),
  inspection_date: z.string().min(1, "Inspection date is required"),
  auction_start_date: z.string().min(1, "Auction start date is required"),
});

type ManualInspectionBatchFormData = z.infer<typeof manualInspectionBatchSchema>;

interface ManualInspectionBatchUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Simplified column mapping modal specifically for batch inspections
function BatchColumnMappingModal({
  isOpen,
  onClose,
  csvData,
  onSuccess,
  onError,
  additionalData,
  isAutoNation = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  csvData: any[];
  onSuccess: () => void;
  onError: (error: Error) => void;
  additionalData: {
    auction_id: number;
    inspector_id: number | null;
    scheduled_date: string;
    inspection_date: string;
    auction_start_date: string;
  };
  isAutoNation?: boolean;
}) {
  const { toast } = useToast();
  const [vinColumn, setVinColumn] = useState<string>("none");
  const [laneColumn, setLaneColumn] = useState<string>("none");
  const [runColumn, setRunColumn] = useState<string>("none");
  const [notesColumn, setNotesColumn] = useState<string>("none");
  const [stockColumn, setStockColumn] = useState<string>("none");
  const [makeColumn, setMakeColumn] = useState<string>("none");
  const [modelColumn, setModelColumn] = useState<string>("none");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get column headers from the first row
  const headers = csvData.length > 0 ? Object.keys(csvData[0]) : [];
  
  // Process mapping and create inspections
  const handleSubmit = async () => {
    // For Auto Nation, run number is required instead of VIN
    if (isAutoNation) {
      if (runColumn === "none") {
        toast({
          title: "Error",
          description: "Run # column is required for Auto Nation",
          variant: "destructive",
        });
        return;
      }
    } else {
      // Regular auctions require VIN
      if (vinColumn === "none") {
        toast({
          title: "Error",
          description: "VIN column is required",
          variant: "destructive",
        });
        return;
      }
    }
    
    setIsSubmitting(true);
    
    try {
      // Map the data
      const mappedData = csvData.map(row => {
        if (isAutoNation) {
          // For Auto Nation, use combined run format and optional fields
          return {
            vin: vinColumn !== "none" ? row[vinColumn] : null, // VIN is optional
            run_number: runColumn !== "none" ? row[runColumn] : null, // This will be parsed on backend
            stock_number: stockColumn !== "none" ? row[stockColumn] : null,
            make: makeColumn !== "none" ? row[makeColumn] : null,
            model: modelColumn !== "none" ? row[modelColumn] : null,
            notes: notesColumn !== "none" ? row[notesColumn] : null,
            ...additionalData
          };
        } else {
          // Regular format
          return {
            vin: row[vinColumn],
            lane_number: laneColumn !== "none" ? row[laneColumn] : null,
            run_number: runColumn !== "none" ? row[runColumn] : null,
            notes: notesColumn !== "none" ? row[notesColumn] : null,
            ...additionalData
          };
        }
      }).filter(item => isAutoNation ? item.run_number : item.vin); // Filter based on auction type
      
      // Send to backend
      const response = await apiRequest(
        "POST", 
        "/api/inspections/batch", 
        { data: mappedData }
      );
      
      if (!response.ok) {
        throw new Error("Failed to create inspections");
      }
      
      // Success!
      toast({
        title: "Success",
        description: `Created ${mappedData.length} inspections successfully`,
      });
      
      onSuccess();
    } catch (error) {
      if (error instanceof Error) {
        onError(error);
      } else {
        onError(new Error("An unknown error occurred"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Map Columns</DialogTitle>
          <DialogDescription>
            Select which columns contain the VIN, Lane Number, Run Number, and Notes.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* VIN Column Mapping */}
              <div className="space-y-2">
                <Label htmlFor="vin-column" className="text-sm font-medium">
                  VIN Column <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={vinColumn}
                  onValueChange={setVinColumn}
                >
                  <SelectTrigger id="vin-column">
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {headers.map((header) => (
                      <SelectItem key={header} value={header}>
                        {header}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Lane Number Column Mapping */}
              <div className="space-y-2">
                <Label htmlFor="lane-column" className="text-sm font-medium">
                  Lane Number Column
                </Label>
                <Select
                  value={laneColumn}
                  onValueChange={setLaneColumn}
                >
                  <SelectTrigger id="lane-column">
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {headers.map((header) => (
                      <SelectItem key={header} value={header}>
                        {header}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Run Number Column Mapping */}
              <div className="space-y-2">
                <Label htmlFor="run-column" className="text-sm font-medium">
                  Run Number Column
                </Label>
                <Select
                  value={runColumn}
                  onValueChange={setRunColumn}
                >
                  <SelectTrigger id="run-column">
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {headers.map((header) => (
                      <SelectItem key={header} value={header}>
                        {header}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Notes Column Mapping */}
              <div className="space-y-2">
                <Label htmlFor="notes-column" className="text-sm font-medium">
                  Notes Column
                </Label>
                <Select
                  value={notesColumn}
                  onValueChange={setNotesColumn}
                >
                  <SelectTrigger id="notes-column">
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {headers.map((header) => (
                      <SelectItem key={header} value={header}>
                        {header}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* Preview Data */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Data Preview</h3>
            <div className="border rounded-md overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {headers.map((header) => (
                      <th
                        key={header}
                        className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {csvData.slice(0, 5).map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {headers.map((header) => (
                        <td key={header} className="px-3 py-2 text-xs text-gray-500">
                          {row[header]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {csvData.length > 5 && (
              <p className="text-xs text-gray-500">
                Showing 5 of {csvData.length} rows
              </p>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner className="mr-2 h-4 w-4" /> Processing...
              </>
            ) : (
              'Create Inspections'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ManualInspectionBatchUploadModal({
  isOpen,
  onClose,
}: ManualInspectionBatchUploadModalProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [formData, setFormData] = useState<ManualInspectionBatchFormData | null>(null);
  const [csvData, setCsvData] = useState<any[] | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Form setup
  const form = useForm<ManualInspectionBatchFormData>({
    resolver: zodResolver(manualInspectionBatchSchema),
    defaultValues: {
      inspector_id: "none",
      auction_id: "",
      inspection_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      auction_start_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    },
  });

  // Query for auctions
  const { data: auctions } = useQuery<Auction[]>({
    queryKey: ["/api/auctions"],
  });

  // Check if selected auction is Auto Nation
  const selectedAuction = formData ? auctions?.find(a => a.id === parseInt(formData.auction_id)) : null;
  const isAutoNation = selectedAuction ?
    (selectedAuction.name.toLowerCase().includes('auto nation') ||
     selectedAuction.name.toLowerCase().includes('autonation')) : false;

  // Query for inspectors
  const { data: inspectors } = useQuery<Inspector[]>({
    queryKey: ["/api/inspectors"],
  });

  // Handle file selection
  const handleFileSelection = useCallback((selectedFile: File) => {
    // Validate file type
    const validTypes = ['.csv', '.xlsx', '.xls'];
    const fileExtension = selectedFile.name.toLowerCase().substr(selectedFile.name.lastIndexOf('.'));

    if (!validTypes.includes(fileExtension)) {
      setError('Please upload a CSV or Excel file');
      return;
    }

    setFile(selectedFile);
    setFileName(selectedFile.name);
    setError(null);
  }, []);

  // Handle file upload from input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelection(selectedFile);
    }
  };

  // Handle drag and drop
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleFileSelection(droppedFile);
    }
  }, [handleFileSelection]);

  // Mutation for parsing CSV file
  const parseCsvMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch("/api/file/parse", {
        method: "POST",
        body: data,
      });
      if (!response.ok) {
        throw new Error("Failed to parse file");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setCsvData(data.data);
      setShowMappingModal(true);
    },
    onError: (error: Error) => {
      setError(error.message);
      toast({
        title: "Error",
        description: "Failed to parse the file. Please check the file format.",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: ManualInspectionBatchFormData) => {
    if (!file) {
      setError("Please select a file");
      return;
    }

    setFormData(data);
    
    const formData = new FormData();
    formData.append("file", file);
    
    parseCsvMutation.mutate(formData);
  };

  // Reset state when modal is closed
  const handleClose = () => {
    setFile(null);
    setFileName("");
    setError(null);
    setShowMappingModal(false);
    setFormData(null);
    setCsvData(null);
    form.reset();
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen && !showMappingModal} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manual Inspection Batch Upload</DialogTitle>
            <DialogDescription>
              Upload a CSV file with vehicles to create manual inspections.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Auction Selection */}
              <FormField
                control={form.control}
                name="auction_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Auction</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select auction" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {auctions?.map((auction) => (
                          <SelectItem 
                            key={auction.id} 
                            value={auction.id.toString()}
                          >
                            {auction.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />



              {/* Inspector Selection */}
              <FormField
                control={form.control}
                name="inspector_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inspector (Optional)</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select inspector" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No inspector assigned</SelectItem>
                        {inspectors?.map((inspector) => (
                          <SelectItem 
                            key={inspector.id} 
                            value={inspector.id.toString()}
                          >
                            {inspector.user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Inspection Date */}
              <FormField
                control={form.control}
                name="inspection_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inspection Date</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Auction Start Date */}
              <FormField
                control={form.control}
                name="auction_start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Auction Start Date</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* File Upload with Drag and Drop */}
              <div className="space-y-2">
                <FormLabel>Upload CSV File</FormLabel>
                <div
                  className={`relative border-2 border-dashed rounded-lg transition-colors ${
                    isDragging
                      ? 'border-blue-500 bg-blue-50'
                      : file
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <div className="p-6 text-center">
                    {file ? (
                      <div className="space-y-2">
                        <FileUp className="mx-auto h-12 w-12 text-green-500" />
                        <p className="text-sm font-medium text-gray-700">{fileName}</p>
                        <p className="text-xs text-gray-500">File ready for upload</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setFile(null);
                            setFileName('');
                            setError(null);
                          }}
                        >
                          Remove File
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            {isDragging ? 'Drop file here' : 'Drag and drop your file here'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">or</p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById("file-upload")?.click()}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Browse Files
                        </Button>
                        <p className="text-xs text-gray-500">
                          Supported formats: CSV, XLS, XLSX
                        </p>
                      </div>
                    )}
                  </div>
                  <Input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                </div>
                {error && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{error}</AlertTitle>
                  </Alert>
                )}
              </div>

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleClose}
                  disabled={parseCsvMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={parseCsvMutation.isPending || !file}
                >
                  {parseCsvMutation.isPending ? 'Processing...' : 'Continue'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {showMappingModal && csvData && formData && (
        <BatchColumnMappingModal
          isOpen={showMappingModal}
          onClose={handleClose}
          csvData={csvData}
          isAutoNation={isAutoNation}
          onSuccess={() => {
            toast({
              title: "Success",
              description: "Manual inspections created successfully",
            });
            queryClient.invalidateQueries({ queryKey: ["/api/inspections"] });
            handleClose();
          }}
          onError={(error) => {
            toast({
              title: "Error",
              description: error.message,
              variant: "destructive",
            });
          }}
          additionalData={{
            auction_id: parseInt(formData.auction_id),
            inspector_id: formData.inspector_id !== "none" ? parseInt(formData.inspector_id) : null,
            scheduled_date: formData.inspection_date,
            inspection_date: formData.inspection_date,
            auction_start_date: formData.auction_start_date,
          }}
        />
      )}
    </>
  );
}