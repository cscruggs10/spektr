import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type ColumnMappingModalProps = {
  open: boolean;
  onClose: () => void;
  runlistId: number;
  auctionId: number;
  availableColumns: string[];
};

export function ColumnMappingModal({
  open,
  onClose,
  runlistId,
  auctionId,
  availableColumns
}: ColumnMappingModalProps) {
  // Initialize state with values that will never be empty strings to prevent Select errors
  const [vinColumn, setVinColumn] = useState<string>("select");
  const [laneColumn, setLaneColumn] = useState<string>("none");
  const [runColumn, setRunColumn] = useState<string>("none");
  const [makeColumn, setMakeColumn] = useState<string>("none");
  const [modelColumn, setModelColumn] = useState<string>("none");
  const [yearColumn, setYearColumn] = useState<string>("none");
  const [mileageColumn, setMileageColumn] = useState<string>("none");
  
  // Filter out any empty columns to prevent SelectItem errors
  const filteredColumns = availableColumns.filter(col => col && col.trim() !== '');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // No auto-detection - let user manually map columns since different auctions will have different header formats
  
  // Save the column mapping and process the runlist
  const saveColumnMappingMutation = useMutation({
    mutationFn: async (mapping: { name: string, mapping: Record<string, string> }) => {
      const response = await apiRequest("POST", "/api/column-mappings", mapping);
      return response.json();
    },
    onSuccess: () => {
      // Process the runlist with the new mapping
      processRunlistMutation.mutate();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save column mapping",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Process the runlist after saving the column mapping
  const processRunlistMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/runlists/${runlistId}/process`, {});
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Runlist processed successfully",
        description: `Processed ${data.vehicle_count} vehicles with ${data.match_count} matches.`
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/runlists"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      
      // Close the modal
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to process runlist",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const handleSaveMapping = () => {
    // Make sure required fields are selected
    if (!vinColumn || vinColumn === "select") {
      toast({
        title: "Missing VIN column",
        description: "VIN column is required to process the runlist.",
        variant: "destructive"
      });
      return;
    }
    
    const mapping: Record<string, string> = {
      vin_column: vinColumn
    };
    
    if (laneColumn && laneColumn !== "none") mapping.lane_column = laneColumn;
    if (runColumn && runColumn !== "none") mapping.run_column = runColumn;
    if (makeColumn && makeColumn !== "none") mapping.make_column = makeColumn;
    if (modelColumn && modelColumn !== "none") mapping.model_column = modelColumn;
    if (yearColumn && yearColumn !== "none") mapping.year_column = yearColumn;
    if (mileageColumn && mileageColumn !== "none") mapping.mileage_column = mileageColumn;
    
    // Save the column mapping
    saveColumnMappingMutation.mutate({
      name: `Auction ${auctionId} Mapping`,
      mapping: mapping
    });
  };
  
  const isLoading = saveColumnMappingMutation.isPending || processRunlistMutation.isPending;
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Map Runlist Columns</DialogTitle>
          <DialogDescription>
            Select which columns in your file correspond to each vehicle attribute.
            At minimum, please map the VIN column to properly identify vehicles.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="col-span-1">
            <Label htmlFor="vin-column" className="text-right font-semibold">
              VIN Column <span className="text-red-500">*</span>
            </Label>
            <Select value={vinColumn} onValueChange={setVinColumn}>
              <SelectTrigger id="vin-column">
                <SelectValue placeholder="Select VIN column" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="select">Select a column</SelectItem>
                {filteredColumns.map((col) => (
                  <SelectItem key={col} value={col}>
                    {col}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="col-span-1">
            <Label htmlFor="lane-column" className="text-right">
              Lane Number Column
            </Label>
            <Select value={laneColumn} onValueChange={setLaneColumn}>
              <SelectTrigger id="lane-column">
                <SelectValue placeholder="Select lane column" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {filteredColumns.map((col) => (
                  <SelectItem key={col} value={col}>
                    {col}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="col-span-1">
            <Label htmlFor="run-column" className="text-right">
              Run Number Column
            </Label>
            <Select value={runColumn} onValueChange={setRunColumn}>
              <SelectTrigger id="run-column">
                <SelectValue placeholder="Select run column" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {filteredColumns.map((col) => (
                  <SelectItem key={col} value={col}>
                    {col}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="col-span-1">
            <Label htmlFor="make-column" className="text-right">
              Make Column
            </Label>
            <Select value={makeColumn} onValueChange={setMakeColumn}>
              <SelectTrigger id="make-column">
                <SelectValue placeholder="Select make column" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {filteredColumns.map((col) => (
                  <SelectItem key={col} value={col}>
                    {col}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="col-span-1">
            <Label htmlFor="model-column" className="text-right">
              Model Column
            </Label>
            <Select value={modelColumn} onValueChange={setModelColumn}>
              <SelectTrigger id="model-column">
                <SelectValue placeholder="Select model column" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {filteredColumns.map((col) => (
                  <SelectItem key={col} value={col}>
                    {col}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="col-span-1">
            <Label htmlFor="year-column" className="text-right">
              Year Column
            </Label>
            <Select value={yearColumn} onValueChange={setYearColumn}>
              <SelectTrigger id="year-column">
                <SelectValue placeholder="Select year column" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {filteredColumns.map((col) => (
                  <SelectItem key={col} value={col}>
                    {col}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="col-span-1">
            <Label htmlFor="mileage-column" className="text-right">
              Mileage Column
            </Label>
            <Select value={mileageColumn} onValueChange={setMileageColumn}>
              <SelectTrigger id="mileage-column">
                <SelectValue placeholder="Select mileage column" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {filteredColumns.map((col) => (
                  <SelectItem key={col} value={col}>
                    {col}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSaveMapping} disabled={isLoading || !vinColumn || vinColumn === "select"}>
            {isLoading ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Processing...
              </>
            ) : (
              "Save Mapping & Process"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}