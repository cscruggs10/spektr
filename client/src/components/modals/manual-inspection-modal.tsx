import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Auction, Dealer, Inspector } from "@/lib/types";

// Schema for manual inspection creation - simplified without dealer requirement
const manualInspectionSchema = z.object({
  auction_id: z.string().min(1, "Auction is required"),
  inspector_id: z.string(),
  vin: z.string().min(1, "VIN is required"),
  lane_number: z.string().min(1, "Lane number is required"),
  run_number: z.string().min(1, "Run number is required"),
  inspection_date: z.string().min(1, "Inspection date is required"),
  auction_start_date: z.string().min(1, "Auction start date is required"),
  notes: z.string().optional(),
});

type ManualInspectionFormData = z.infer<typeof manualInspectionSchema>;

interface ManualInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ManualInspectionModal({
  isOpen,
  onClose,
}: ManualInspectionModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form setup
  const form = useForm<ManualInspectionFormData>({
    resolver: zodResolver(manualInspectionSchema),
    defaultValues: {
      auction_id: "",
      inspector_id: "none",
      vin: "",
      lane_number: "",
      run_number: "",
      inspection_date: new Date().toISOString().split('T')[0], // Today as default
      auction_start_date: new Date().toISOString().split('T')[0], // Today as default
      notes: "",
    },
  });

  // Removed dealer query since dealers are no longer required

  // Query for inspectors
  const { data: inspectors } = useQuery<Inspector[]>({
    queryKey: ["/api/inspectors"],
  });
  
  // Query for auctions
  const { data: auctions } = useQuery<Auction[]>({
    queryKey: ["/api/auctions"],
  });

  // Mutation for creating inspection
  const createInspectionMutation = useMutation({
    mutationFn: async (data: ManualInspectionFormData) => {
      // Create a temporary vehicle for the inspection
      const vehicleData = {
        vin: data.vin,
        make: "Unknown", // Will be populated via VIN lookup
        model: "Unknown", // Will be populated via VIN lookup
        year: null,
        lane_number: data.lane_number, // API expects lane_number and maps to lane
        run_number: parseInt(data.run_number),
        auction_id: parseInt(data.auction_id), // Pass the auction_id to create/find the manual_entries runlist
      };

      const vehicleResponse = await apiRequest("POST", "/api/vehicles/manual", vehicleData);
      if (!vehicleResponse.ok) {
        const errorText = await vehicleResponse.text();
        throw new Error(`Failed to create vehicle: ${errorText}`);
      }
      
      const vehicle = await vehicleResponse.json();
      
      // Create the inspection with the new vehicle
      const inspectionData = {
        vehicle_id: vehicle.id,
        inspector_id: data.inspector_id && data.inspector_id !== "none" ? parseInt(data.inspector_id) : null,
        notes: data.notes || null,
        status: "pending",
        scheduled_date: data.inspection_date ? new Date(data.inspection_date).toISOString() : null, // Convert to ISO string
        auction_start_date: data.auction_start_date ? new Date(data.auction_start_date).toISOString() : null, // Convert to ISO string
        // No template_id needed with our simplified approach
      };

      const inspectionResponse = await apiRequest("POST", "/api/inspections", inspectionData);
      if (!inspectionResponse.ok) {
        const errorText = await inspectionResponse.text();
        throw new Error(`Failed to create inspection: ${errorText}`);
      }
      
      return inspectionResponse.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Inspection created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/inspections"] });
      onClose();
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: ManualInspectionFormData) => {
    createInspectionMutation.mutate(data);
  };

  // Reset form when modal is closed
  useEffect(() => {
    if (!isOpen) {
      form.reset();
    }
  }, [isOpen, form]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Manual Inspection</DialogTitle>
          <DialogDescription>
            Create a new inspection by entering the basic vehicle information.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <FormItem className="md:col-span-2">
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
                            {inspector.user?.name || `Inspector ${inspector.id}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* VIN Field */}
              <FormField
                control={form.control}
                name="vin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle VIN</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter VIN" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
                
              {/* Lane Number */}
              <FormField
                control={form.control}
                name="lane_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lane Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Lane Number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Run Number */}
              <FormField
                control={form.control}
                name="run_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Run Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Run Number" {...field} />
                    </FormControl>
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
                      <Input
                        type="date"
                        {...field}
                      />
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
                      <Input
                        type="date"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any special instructions or notes for this inspection"
                      className="min-h-24"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createInspectionMutation.isPending}>
                {createInspectionMutation.isPending ? "Creating..." : "Create Inspection"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}