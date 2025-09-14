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
import { insertInspectionTemplateSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Extend schema with additional validation
const formSchema = z.object({
  dealer_id: z.number({
    required_error: "Please select a dealer",
  }),
  name: z.string().min(1, "Template name is required"),
  require_photos: z.boolean().default(true),
  require_videos: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateTemplateModal({ isOpen, onClose }: CreateTemplateModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: dealers } = useQuery<Dealer[]>({
    queryKey: ["/api/dealers"],
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      // Create a template with the standard format
      const standardTemplate = {
        ...values,
        fields: [
          {
            id: "verification",
            label: "Vehicle Verification",
            description: "Verify the vehicle information against the auction runlist",
            type: "section",
            items: [
              {
                id: "runlist_photo",
                label: "Auction Run List Tag Photo",
                description: "Take a photo of the auction tag or door badge with VIN",
                type: "photo",
                required: true
              },
              {
                id: "vintel_scan",
                label: "VINTEL Scan Link",
                description: "Provide a link to the VINTEL scan report",
                type: "link",
                required: true
              }
            ]
          },
          {
            id: "exterior",
            label: "Exterior Inspection",
            description: "Perform a walkaround inspection of the vehicle exterior",
            type: "section",
            items: [
              {
                id: "walkaround_video",
                label: "Walkaround Video",
                description: "Record a video walking around the vehicle with the hood up and engine running",
                type: "video",
                required: true
              }
            ]
          },
          {
            id: "interior",
            label: "Interior Inspection",
            description: "Check the interior condition and functionality",
            type: "section",
            items: [
              {
                id: "dashboard_video",
                label: "Dashboard Video",
                description: "Record a video of the dash with the car running, showing mileage and any warning lights",
                type: "video",
                required: true
              }
            ]
          },
          {
            id: "estimates",
            label: "Condition Estimates",
            description: "Provide repair estimates for any issues found",
            type: "section",
            items: [
              {
                id: "cosmetic_estimate",
                label: "Cosmetic Repair Estimate",
                description: "Estimate cost for required cosmetic repairs",
                type: "currency",
                required: true
              },
              {
                id: "mechanical_estimate",
                label: "Mechanical Repair Estimate",
                description: "Estimate cost for required mechanical repairs",
                type: "currency",
                required: true
              }
            ]
          },
          {
            id: "recommendation",
            label: "Inspector Recommendation",
            description: "Inspector's overall assessment and recommendation",
            type: "section",
            items: [
              {
                id: "recommendation",
                label: "Purchase Recommendation",
                description: "Do you recommend purchasing this vehicle?",
                type: "select",
                options: ["Recommend Purchase", "Do Not Recommend", "Needs Further Evaluation"],
                required: true
              },
              {
                id: "comments",
                label: "Additional Comments",
                description: "Any additional comments or concerns",
                type: "textarea",
                required: false
              }
            ]
          }
        ]
      };

      const response = await apiRequest("POST", "/api/inspection-templates", standardTemplate);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inspection-templates"] });
      toast({
        title: "Template created",
        description: "Inspection template has been created successfully.",
      });
      form.reset();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create template",
        variant: "destructive",
      });
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "Standard Inspection",
      require_photos: true,
      require_videos: true,
    },
  });

  const onSubmit = (values: FormValues) => {
    createTemplateMutation.mutate(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Inspection Template</DialogTitle>
          <DialogDescription>
            Create a new inspection template for a dealer. Templates define the steps inspectors must follow.
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
                    value={field.value?.toString()}
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
                  <FormDescription>
                    Select the dealer this template will be used for
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter template name" {...field} />
                  </FormControl>
                  <FormDescription>
                    Give this template a descriptive name
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="require_photos"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Require Photos</FormLabel>
                    <FormDescription>
                      Require inspectors to upload photos during inspection
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
              name="require_videos"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Require Videos</FormLabel>
                    <FormDescription>
                      Require inspectors to upload videos during inspection
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

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={createTemplateMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createTemplateMutation.isPending}
              >
                {createTemplateMutation.isPending ? "Creating..." : "Create Template"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}