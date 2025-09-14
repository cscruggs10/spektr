import { useState } from "react";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
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
import { Inspection, Dealer, Inspector, InspectionStatus } from "@/lib/types";
import { formatDistanceToNow, format } from "date-fns";
import ManualInspectionModal from "@/components/modals/manual-inspection-modal";
import ManualInspectionBatchUploadModal from "@/components/modals/manual-inspection-batch-upload-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Inspections() {
  const [location, setLocation] = useLocation();
  const urlParams = new URLSearchParams(location.split("?")[1] || "");
  
  const [selectedDealerId, setSelectedDealerId] = useState<string>("all");
  const [selectedInspectorId, setSelectedInspectorId] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>(urlParams.get("status") || "all");
  const [isManualInspectionModalOpen, setIsManualInspectionModalOpen] = useState(false);
  const [isBatchUploadModalOpen, setIsBatchUploadModalOpen] = useState(false);

  const { data: inspections, isLoading: isInspectionsLoading } = useQuery<Inspection[]>({
    queryKey: [
      "/api/inspections", 
      selectedDealerId ? parseInt(selectedDealerId) : undefined,
      selectedInspectorId ? parseInt(selectedInspectorId) : undefined,
      selectedStatus
    ],
    queryFn: async ({ queryKey }) => {
      const [_, dealerId, inspectorId, status] = queryKey;
      
      let url = "/api/inspections";
      const params = new URLSearchParams();
      
      if (dealerId && dealerId !== "all") params.append("dealerId", dealerId.toString());
      if (inspectorId && inspectorId !== "all") params.append("inspectorId", inspectorId.toString());
      if (status && status !== "all") params.append("status", status.toString());
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch inspections");
      return response.json();
    }
  });

  const { data: dealers } = useQuery<Dealer[]>({
    queryKey: ["/api/dealers"],
  });

  const { data: inspectors } = useQuery<Inspector[]>({
    queryKey: ["/api/inspectors"],
  });

  const getStatusBadgeClass = (status: InspectionStatus) => {
    switch (status) {
      case "pending":
        return "bg-gray-100 text-gray-800";
      case "scheduled":
        return "bg-yellow-100 text-yellow-800";
      case "in_progress":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "canceled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "Not scheduled";
    
    const date = new Date(dateString);
    return format(date, "MMM d, yyyy 'at' h:mm a");
  };

  return (
    <>
      <Helmet>
        <title>Inspections | AutoInspect Pro</title>
        <link 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" 
          rel="stylesheet"
        />
      </Helmet>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">Inspections</h1>
            <div className="flex space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button>
                    <i className="fas fa-plus mr-2"></i>
                    Create Inspection
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setIsManualInspectionModalOpen(true)}>
                    Single Inspection
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsBatchUploadModalOpen(true)}>
                    Batch Upload
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
          <Card>
            <CardHeader className="flex flex-col space-y-4">
              <CardTitle>Inspection Management</CardTitle>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Select value={selectedDealerId} onValueChange={setSelectedDealerId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by dealer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Dealers</SelectItem>
                      {dealers?.map((dealer) => (
                        <SelectItem key={dealer.id} value={dealer.id.toString()}>
                          {dealer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select value={selectedInspectorId} onValueChange={setSelectedInspectorId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by inspector" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Inspectors</SelectItem>
                      {inspectors?.map((inspector) => (
                        <SelectItem key={inspector.id} value={inspector.id.toString()}>
                          {inspector.user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="canceled">Canceled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isInspectionsLoading ? (
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
                        <TableHead>Lane/Run</TableHead>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Dealer</TableHead>
                        <TableHead>Inspector</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Scheduled Date</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inspections && inspections.length > 0 ? (
                        inspections.map((inspection) => (
                          <TableRow key={inspection.id}>
                            <TableCell className="font-medium whitespace-nowrap">
                              {inspection.vehicle.lane_number ? (
                                <>
                                  <span className="font-bold">Lane {inspection.vehicle.lane_number}</span>
                                  {inspection.vehicle.run_number && (
                                    <span> / Run {inspection.vehicle.run_number}</span>
                                  )}
                                </>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell className="font-medium">
                              {inspection.vehicle.year} {inspection.vehicle.make} {inspection.vehicle.model} {inspection.vehicle.trim || ""}
                            </TableCell>
                            <TableCell>{inspection.dealer?.name || "No Dealer"}</TableCell>
                            <TableCell>{inspection.inspector?.user?.name || "Unassigned"}</TableCell>
                            <TableCell>
                              <Badge className={getStatusBadgeClass(inspection.status)}>
                                {inspection.status.replace('_', ' ').charAt(0).toUpperCase() + inspection.status.replace('_', ' ').slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatDateTime(inspection.scheduled_date)}</TableCell>
                            <TableCell>
                              {formatDistanceToNow(new Date(inspection.created_at), { addSuffix: true })}
                            </TableCell>
                            <TableCell>
                              <Button variant="outline" size="sm">
                                View Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-4 text-gray-500">
                            No inspections found matching your filters.
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
      
      <ManualInspectionModal 
        isOpen={isManualInspectionModalOpen}
        onClose={() => setIsManualInspectionModalOpen(false)}
      />
      
      <ManualInspectionBatchUploadModal
        isOpen={isBatchUploadModalOpen}
        onClose={() => setIsBatchUploadModalOpen(false)}
      />
    </>
  );
}
