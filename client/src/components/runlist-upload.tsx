import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, FileSpreadsheet, Plus, X, Calendar } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface RunlistUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RunlistUpload({ open, onOpenChange }: RunlistUploadProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadMode, setUploadMode] = useState<"batch" | "single">("batch");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    auction_id: "",
    inspector_id: "",
    inspection_date: "",
  });

  // Single vehicle form state
  const [singleVehicle, setSingleVehicle] = useState({
    vin: "",
    make: "",
    model: "",
    year: "",
    lane_number: "",
    run_number: "",
    stock_number: "",
    mileage: "",
    color: "",
  });

  const { data: auctions = [] } = useQuery({
    queryKey: ["/api/auctions"],
  });

  const { data: inspectors = [] } = useQuery({
    queryKey: ["/api/inspectors"],
  });

  const uploadRunlistMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest("POST", "/api/runlists/upload", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/runlists"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inspections"] });
      toast({ 
        title: "Success", 
        description: `Runlist uploaded successfully. ${data.vehicleCount} vehicles processed.` 
      });
      resetForm();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Upload Failed", 
        description: error.message || "Failed to upload runlist",
        variant: "destructive" 
      });
    },
  });

  const createSingleVehicleMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/runlists/single", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/runlists"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inspections"] });
      toast({ title: "Success", description: "Vehicle added successfully" });
      resetForm();
      onOpenChange(false);
    },
  });

  const resetForm = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setIsUploading(false);
    setFormData({
      auction_id: "",
      inspector_id: "",
      inspection_date: "",
    });
    setSingleVehicle({
      vin: "",
      make: "",
      model: "",
      year: "",
      lane_number: "",
      run_number: "",
      stock_number: "",
      mileage: "",
      color: "",
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = [
        "text/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ];
      
      if (validTypes.includes(file.type) || file.name.endsWith('.csv') || file.name.endsWith('.xlsx')) {
        setSelectedFile(file);
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please select a CSV or Excel file",
          variant: "destructive"
        });
      }
    }
  };

  const handleBatchUpload = () => {
    if (!selectedFile || !formData.auction_id || !formData.inspection_date) {
      toast({
        title: "Missing Information",
        description: "Please select a file, auction, and inspection date",
        variant: "destructive"
      });
      return;
    }

    const data = new FormData();
    data.append("file", selectedFile);
    data.append("auction_id", formData.auction_id);
    data.append("inspector_id", formData.inspector_id || "");
    data.append("inspection_date", formData.inspection_date);

    setIsUploading(true);
    uploadRunlistMutation.mutate(data);
  };

  const handleSingleVehicleSubmit = () => {
    if (!formData.auction_id || !formData.inspection_date || !singleVehicle.vin) {
      toast({
        title: "Missing Information",
        description: "Please fill in auction, inspection date, and VIN",
        variant: "destructive"
      });
      return;
    }

    const data = {
      ...formData,
      ...singleVehicle,
      year: singleVehicle.year ? parseInt(singleVehicle.year) : null,
      mileage: singleVehicle.mileage ? parseInt(singleVehicle.mileage) : null,
    };

    createSingleVehicleMutation.mutate(data);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Vehicles to Inspection List</DialogTitle>
          <DialogDescription>
            Upload a runlist file or add individual vehicles for inspection
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload Mode Selection */}
          <div className="flex gap-2">
            <Button
              variant={uploadMode === "batch" ? "default" : "outline"}
              onClick={() => setUploadMode("batch")}
              className="flex-1"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Batch Upload
            </Button>
            <Button
              variant={uploadMode === "single" ? "default" : "outline"}
              onClick={() => setUploadMode("single")}
              className="flex-1"
            >
              <Plus className="h-4 w-4 mr-2" />
              Single Vehicle
            </Button>
          </div>

          {/* Common Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="auction">Auction Location *</Label>
              <Select 
                value={formData.auction_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, auction_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select auction" />
                </SelectTrigger>
                <SelectContent>
                  {auctions.map((auction: any) => (
                    <SelectItem key={auction.id} value={auction.id.toString()}>
                      {auction.name} - {auction.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="inspector">Assigned Inspector</Label>
              <Select 
                value={formData.inspector_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, inspector_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select inspector (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {inspectors.map((inspector: any) => (
                    <SelectItem key={inspector.id} value={inspector.id.toString()}>
                      {inspector.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="inspection_date">Inspection Date *</Label>
            <Input
              id="inspection_date"
              type="date"
              value={formData.inspection_date}
              onChange={(e) => setFormData(prev => ({ ...prev, inspection_date: e.target.value }))}
              min={formatDate(new Date().toISOString())}
            />
          </div>

          {/* Batch Upload Mode */}
          {uploadMode === "batch" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Upload Runlist File</CardTitle>
                <CardDescription>
                  Upload a CSV or Excel file containing vehicle information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  {selectedFile ? (
                    <div>
                      <p className="text-sm font-medium">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-gray-600">
                        Click to select a runlist file
                      </p>
                      <p className="text-xs text-gray-500">
                        Supports CSV and Excel files
                      </p>
                    </div>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {selectedFile && (
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{selectedFile.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedFile(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Single Vehicle Mode */}
          {uploadMode === "single" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Vehicle Information</CardTitle>
                <CardDescription>
                  Enter vehicle details manually
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vin">VIN *</Label>
                    <Input
                      id="vin"
                      value={singleVehicle.vin}
                      onChange={(e) => setSingleVehicle(prev => ({ ...prev, vin: e.target.value }))}
                      placeholder="17-character VIN"
                      maxLength={17}
                    />
                  </div>
                  <div>
                    <Label htmlFor="stock_number">Stock Number</Label>
                    <Input
                      id="stock_number"
                      value={singleVehicle.stock_number}
                      onChange={(e) => setSingleVehicle(prev => ({ ...prev, stock_number: e.target.value }))}
                      placeholder="Stock number"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="make">Make</Label>
                    <Input
                      id="make"
                      value={singleVehicle.make}
                      onChange={(e) => setSingleVehicle(prev => ({ ...prev, make: e.target.value }))}
                      placeholder="e.g., Honda"
                    />
                  </div>
                  <div>
                    <Label htmlFor="model">Model</Label>
                    <Input
                      id="model"
                      value={singleVehicle.model}
                      onChange={(e) => setSingleVehicle(prev => ({ ...prev, model: e.target.value }))}
                      placeholder="e.g., Accord"
                    />
                  </div>
                  <div>
                    <Label htmlFor="year">Year</Label>
                    <Input
                      id="year"
                      type="number"
                      value={singleVehicle.year}
                      onChange={(e) => setSingleVehicle(prev => ({ ...prev, year: e.target.value }))}
                      placeholder="2020"
                      min="1900"
                      max="2030"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="lane_number">Lane Number</Label>
                    <Input
                      id="lane_number"
                      value={singleVehicle.lane_number}
                      onChange={(e) => setSingleVehicle(prev => ({ ...prev, lane_number: e.target.value }))}
                      placeholder="Lane #"
                    />
                  </div>
                  <div>
                    <Label htmlFor="run_number">Run Number</Label>
                    <Input
                      id="run_number"
                      value={singleVehicle.run_number}
                      onChange={(e) => setSingleVehicle(prev => ({ ...prev, run_number: e.target.value }))}
                      placeholder="Run #"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mileage">Mileage</Label>
                    <Input
                      id="mileage"
                      type="number"
                      value={singleVehicle.mileage}
                      onChange={(e) => setSingleVehicle(prev => ({ ...prev, mileage: e.target.value }))}
                      placeholder="Miles"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    value={singleVehicle.color}
                    onChange={(e) => setSingleVehicle(prev => ({ ...prev, color: e.target.value }))}
                    placeholder="Vehicle color"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {uploadMode === "batch" ? (
              <Button 
                onClick={handleBatchUpload}
                disabled={!selectedFile || !formData.auction_id || !formData.inspection_date || isUploading}
              >
                {isUploading ? "Uploading..." : "Upload Runlist"}
              </Button>
            ) : (
              <Button 
                onClick={handleSingleVehicleSubmit}
                disabled={!formData.auction_id || !formData.inspection_date || !singleVehicle.vin || createSingleVehicleMutation.isPending}
              >
                {createSingleVehicleMutation.isPending ? "Adding..." : "Add Vehicle"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}