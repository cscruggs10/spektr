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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { X } from "lucide-react";
import { Inspector } from "@/lib/types";
import AddInspectorModal from "@/components/modals/add-inspector-modal";
import EditInspectorModal from "@/components/modals/edit-inspector-modal";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Inspectors() {
  const [isAddInspectorModalOpen, setIsAddInspectorModalOpen] = useState(false);
  const [isEditInspectorModalOpen, setIsEditInspectorModalOpen] = useState(false);
  const [selectedInspectorId, setSelectedInspectorId] = useState<number | null>(null);
  const [selectedInspectorForEdit, setSelectedInspectorForEdit] = useState<Inspector | null>(null);
  const [isAuctionDialogOpen, setIsAuctionDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: inspectors, isLoading } = useQuery<Inspector[]>({
    queryKey: ["/api/inspectors"],
  });

  const { data: auctions = [] } = useQuery({
    queryKey: ["/api/auctions"],
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const getRatingColor = (rating?: number) => {
    if (!rating) return "bg-gray-200";
    if (rating >= 4) return "bg-green-100 text-green-800";
    if (rating >= 3) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  // Mutations for auction assignments
  const assignAuctionMutation = useMutation({
    mutationFn: async ({ inspectorId, auctionId }: { inspectorId: number; auctionId: number }) => {
      const res = await apiRequest("POST", `/api/inspectors/${inspectorId}/auctions`, {
        auction_id: auctionId
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inspectors"] });
      toast({
        title: "Success",
        description: "Inspector assigned to auction successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign inspector to auction",
        variant: "destructive",
      });
    }
  });

  const removeAuctionMutation = useMutation({
    mutationFn: async ({ inspectorId, auctionId }: { inspectorId: number; auctionId: number }) => {
      const res = await apiRequest("DELETE", `/api/inspectors/${inspectorId}/auctions/${auctionId}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inspectors"] });
      toast({
        title: "Success",
        description: "Inspector removed from auction successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove inspector from auction",
        variant: "destructive",
      });
    }
  });

  const handleManageAuctions = (inspectorId: number) => {
    setSelectedInspectorId(inspectorId);
    setIsAuctionDialogOpen(true);
  };

  const handleEditInspector = (inspector: Inspector) => {
    setSelectedInspectorForEdit(inspector);
    setIsEditInspectorModalOpen(true);
  };

  const handleAssignAuction = (auctionId: number) => {
    if (selectedInspectorId) {
      assignAuctionMutation.mutate({ inspectorId: selectedInspectorId, auctionId });
    }
  };

  const handleRemoveAuction = (auctionId: number) => {
    if (selectedInspectorId) {
      removeAuctionMutation.mutate({ inspectorId: selectedInspectorId, auctionId });
    }
  };

  const selectedInspector = inspectors?.find(i => i.id === selectedInspectorId);

  return (
    <>
      <Helmet>
        <title>Inspectors | AutoInspect Pro</title>
        <link 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" 
          rel="stylesheet"
        />
      </Helmet>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">Inspectors</h1>
            <Button onClick={() => setIsAddInspectorModalOpen(true)}>
              <i className="fas fa-plus mr-2"></i>
              Add Inspector
            </Button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Inspector Management</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
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
                        <TableHead>Inspector</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Assigned Auctions</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inspectors && inspectors.length > 0 ? (
                        inspectors.map((inspector) => (
                          <TableRow key={inspector.id}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <Avatar>
                                  <AvatarFallback>{getInitials(inspector.user.name)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{inspector.user.name}</div>
                                  <div className="text-sm text-gray-500">{inspector.user.username}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {inspector.rating ? (
                                <Badge className={getRatingColor(inspector.rating)}>
                                  {inspector.rating} / 5
                                </Badge>
                              ) : (
                                <Badge variant="outline">No ratings</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {inspector.active ? (
                                <Badge className="bg-green-100 text-green-800">Active</Badge>
                              ) : (
                                <Badge variant="secondary">Inactive</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {inspector.auctions && inspector.auctions.length > 0 ? (
                                  inspector.auctions.map((auction: any) => (
                                    <Badge key={auction.id} variant="outline" className="text-xs">
                                      {auction.name}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-gray-500 text-sm">No auctions assigned</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditInspector(inspector)}
                                >
                                  <i className="fas fa-edit mr-2"></i>
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleManageAuctions(inspector.id)}
                                >
                                  Manage Auctions
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                            No inspectors found. Add an inspector to get started.
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

      <AddInspectorModal
        isOpen={isAddInspectorModalOpen}
        onClose={() => setIsAddInspectorModalOpen(false)}
      />

      <EditInspectorModal
        isOpen={isEditInspectorModalOpen}
        onClose={() => {
          setIsEditInspectorModalOpen(false);
          setSelectedInspectorForEdit(null);
        }}
        inspector={selectedInspectorForEdit}
      />

      {/* Auction Management Dialog */}
      <Dialog open={isAuctionDialogOpen} onOpenChange={setIsAuctionDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Manage Auctions for {selectedInspector?.user.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Currently Assigned Auctions */}
            <div>
              <h4 className="font-medium mb-3">Currently Assigned Auctions</h4>
              <div className="space-y-2">
                {selectedInspector?.auctions && selectedInspector.auctions.length > 0 ? (
                  selectedInspector.auctions.map((auction: any) => (
                    <div key={auction.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{auction.name}</div>
                        <div className="text-sm text-gray-500">{auction.description}</div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveAuction(auction.id)}
                        disabled={removeAuctionMutation.isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No auctions currently assigned</p>
                )}
              </div>
            </div>

            {/* Available Auctions to Assign */}
            <div>
              <h4 className="font-medium mb-3">Available Auctions</h4>
              <div className="space-y-2">
                {auctions
                  .filter((auction: any) => 
                    !selectedInspector?.auctions?.some((assigned: any) => assigned.id === auction.id)
                  )
                  .map((auction: any) => (
                    <div key={auction.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{auction.name}</div>
                        <div className="text-sm text-gray-500">{auction.description}</div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAssignAuction(auction.id)}
                        disabled={assignAuctionMutation.isPending}
                      >
                        Assign
                      </Button>
                    </div>
                  ))
                }
                {auctions.filter((auction: any) => 
                  !selectedInspector?.auctions?.some((assigned: any) => assigned.id === auction.id)
                ).length === 0 && (
                  <p className="text-gray-500 text-sm">All available auctions are already assigned</p>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
