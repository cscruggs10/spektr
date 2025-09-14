import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
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
  FormDescription,
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
import { Switch } from "@/components/ui/switch";
import { Dealer } from "@/lib/types";
import { insertBuyBoxItemSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { VehicleSelector } from "@/components/vehicle-selector";

// Extend the schema with additional validation
const formSchema = insertBuyBoxItemSchema.extend({
  dealer_id: z.number({
    required_error: "Please select a dealer",
  }),
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year_min: z.number().optional(),
  year_max: z.number().optional(),
  mileage_min: z.number().optional(),
  mileage_max: z.number().optional(),
  price_min: z.number().optional(),
  price_max: z.number().optional(),
  structural_damage: z.boolean().optional().default(false),
  max_accidents: z.number().optional(),
  max_owners: z.number().optional(),
  damage_severity: z.enum(["Minor", "Moderate", "Severe"]).optional(),
  leather: z.boolean().optional().default(false),
  sunroof: z.boolean().optional().default(false),
});

type FormValues = z.infer<typeof formSchema>;

interface AddVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddVehicleModal({ isOpen, onClose }: AddVehicleModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedMakeId, setSelectedMakeId] = useState<string | null>(null);
  const [selectedMakeName, setSelectedMakeName] = useState<string | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [selectedModelName, setSelectedModelName] = useState<string | null>(null);

  const { data: dealers } = useQuery<Dealer[]>({
    queryKey: ["/api/dealers"],
  });

  const addVehicleMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const response = await apiRequest("POST", "/api/buy-box", values);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/buy-box"] });
      toast({
        title: "Vehicle added",
        description: "The vehicle has been added to the Buy Box successfully.",
      });
      form.reset();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add vehicle to Buy Box",
        variant: "destructive",
      });
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      make: "",
      model: "",
      trim: "",
      status: "active",
      structural_damage: false,
      leather: false,
      sunroof: false,
    },
  });

  // Handle make/model changes from the NHTSA vehicle selector
  const handleMakeChange = (makeId: string, makeName: string) => {
    setSelectedMakeId(makeId);
    setSelectedMakeName(makeName);
    form.setValue("make", makeName);
  };

  const handleModelChange = (modelId: string, modelName: string) => {
    setSelectedModelId(modelId);
    setSelectedModelName(modelName);
    form.setValue("model", modelName);
  };

  const onSubmit = (values: FormValues) => {
    // Ensure the form values are updated with the selected make/model from NHTSA
    if (selectedMakeName) {
      values.make = selectedMakeName;
    }
    if (selectedModelName) {
      values.model = selectedModelName;
    }
    
    addVehicleMutation.mutate(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Vehicle to Buy Box</DialogTitle>
          <DialogDescription>
            Add vehicle details to the dealer's Buy Box. These criteria will be used to match against auction runlists.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="dealer_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dealer</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(parseInt(value))} 
                    value={field.value?.toString() || ""}
                    defaultValue=""
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a dealer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {dealers?.filter(d => d.status === "active").map((dealer) => (
                        <SelectItem key={dealer.id} value={dealer.id.toString()}>
                          {dealer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Vehicle Criteria</h3>
              <FormDescription>
                Select vehicle make and model from the NHTSA database for consistent matching with runlist VINs.
              </FormDescription>
              <VehicleSelector 
                onMakeChange={handleMakeChange}
                onModelChange={handleModelChange}
                defaultMakeId={selectedMakeId || undefined}
                defaultModelId={selectedModelId || undefined}
              />
              
              {selectedMakeName && (
                <div className="pt-2">
                  <FormLabel>Selected Make:</FormLabel>
                  <div className="font-medium text-primary">{selectedMakeName}</div>
                </div>
              )}
              
              {selectedModelName && (
                <div className="pt-2">
                  <FormLabel>Selected Model:</FormLabel>
                  <div className="font-medium text-primary">{selectedModelName}</div>
                </div>
              )}
            </div>

            <FormField
              control={form.control}
              name="trim"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trim</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="XLE, Limited, etc. (optional)" 
                      value={field.value || ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormDescription>
                    Leave blank to match any trim level
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="year_min"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year (Min)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Minimum year" 
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="year_max"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year (Max)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Maximum year" 
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="mileage_min"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mileage (Min)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mileage_max"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mileage (Max)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="75000" 
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price_min"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price Target (Min)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="$10000" 
                        step="500"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormDescription>
                      Minimum price ($500 increments)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price_max"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price Target (Max)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="$15000" 
                        step="500"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormDescription>
                      Maximum price ($500 increments)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Vehicle Pedigree</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="structural_damage"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Structural Damage</FormLabel>
                        <FormDescription>
                          Allow vehicles with structural damage?
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="max_accidents"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Accidents</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          value={field.value === undefined ? "" : field.value}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum number of accidents allowed
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="max_owners"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Previous Owners</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        value={field.value === undefined ? "" : field.value}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormDescription>
                      Maximum number of previous owners allowed (leave blank if no preference)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="damage_severity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Damage Severity</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select severity" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Minor">Minor</SelectItem>
                          <SelectItem value="Moderate">Moderate</SelectItem>
                          <SelectItem value="Severe">Severe</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Maximum acceptable damage severity
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="leather"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Leather</FormLabel>
                        <FormDescription>
                          Require leather interior?
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="sunroof"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Sunroof</FormLabel>
                        <FormDescription>
                          Require sunroof?
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={addVehicleMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={addVehicleMutation.isPending}
              >
                {addVehicleMutation.isPending ? "Adding..." : "Add to Buy Box"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
