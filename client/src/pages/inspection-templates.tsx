import { useState } from "react";
import { Helmet } from "react-helmet";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { InspectionTemplate, Dealer } from "@/lib/types";
import { Switch } from "@/components/ui/switch";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import CreateTemplateModal from "@/components/modals/create-template-modal";

export default function InspectionTemplates() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDealerId, setSelectedDealerId] = useState<string>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: templates, isLoading: isTemplatesLoading } = useQuery<InspectionTemplate[]>({
    queryKey: [
      "/api/inspection-templates", 
      selectedDealerId !== "all" ? parseInt(selectedDealerId) : undefined
    ],
    queryFn: async ({ queryKey }) => {
      const [_, dealerId] = queryKey;
      
      let url = "/api/inspection-templates";
      if (dealerId) url += `?dealerId=${dealerId}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch templates");
      return response.json();
    }
  });

  const { data: dealers } = useQuery<Dealer[]>({
    queryKey: ["/api/dealers"],
  });

  const createStandardTemplateMutation = useMutation({
    mutationFn: async (dealerId: number) => {
      const standardTemplate = {
        dealer_id: dealerId,
        name: "Standard Inspection",
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
            id: "module_scan",
            label: "Full Module Scan",
            description: "Complete diagnostic scan of all vehicle modules",
            type: "section",
            items: [
              {
                id: "module_scan_report",
                label: "Module Scan Report",
                description: "Link to the complete module scan report",
                type: "link",
                required: false
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
        ],
        require_photos: true,
        require_videos: true
      };

      const response = await apiRequest("POST", "/api/inspection-templates", standardTemplate);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inspection-templates"] });
      toast({
        title: "Template created",
        description: "Standard inspection template has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create standard template",
        variant: "destructive",
      });
    },
  });

  const handleCreateStandardTemplate = (dealerId: number) => {
    createStandardTemplateMutation.mutate(dealerId);
  };

  return (
    <>
      <Helmet>
        <title>Inspection Templates | AutoInspect Pro</title>
        <link 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" 
          rel="stylesheet"
        />
      </Helmet>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">Inspection Templates</h1>
            <div className="space-x-2">
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <i className="fas fa-plus mr-2"></i>
                Create Template
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center space-y-2 sm:space-y-0">
              <CardTitle>Template Management</CardTitle>
              <div className="w-full sm:w-64">
                <Select value={selectedDealerId} onValueChange={setSelectedDealerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by dealer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Dealers</SelectItem>
                    {dealers?.filter(d => d.status === "active").map((dealer) => (
                      <SelectItem key={dealer.id} value={dealer.id.toString()}>
                        {dealer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {isTemplatesLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, idx) => (
                    <div key={idx} className="flex flex-col space-y-2">
                      <Skeleton className="h-6 w-1/2" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Template Name</TableHead>
                        <TableHead>Dealer</TableHead>
                        <TableHead>Photos Required</TableHead>
                        <TableHead>Videos Required</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {templates && templates.length > 0 ? (
                        templates.map((template) => {
                          const dealer = dealers?.find(d => d.id === template.dealer_id);
                          return (
                            <TableRow key={template.id}>
                              <TableCell className="font-medium">{template.name}</TableCell>
                              <TableCell>{dealer?.name || "Unknown"}</TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <Switch checked={template.require_photos} disabled />
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <Switch checked={template.require_videos} disabled />
                                </div>
                              </TableCell>
                              <TableCell>
                                {formatDistanceToNow(new Date(template.created_at), { addSuffix: true })}
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button variant="outline" size="sm">Edit</Button>
                                  <Button variant="outline" size="sm">View</Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <div className="flex flex-col items-center space-y-4">
                              <p className="text-gray-500">No inspection templates found.</p>
                              {selectedDealerId !== "all" && (
                                <Button onClick={() => handleCreateStandardTemplate(parseInt(selectedDealerId))}>
                                  Create Standard Template
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <CreateTemplateModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
    </>
  );
}