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
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Runlist, Auction } from "@/lib/types";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function Runlists() {
  const [expandedRunlistId, setExpandedRunlistId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: runlists, isLoading: isRunlistsLoading } = useQuery<Runlist[]>({
    queryKey: ["/api/runlists"],
  });

  const { data: auctions } = useQuery<Auction[]>({
    queryKey: ["/api/auctions"],
  });

  const getAuctionName = (auctionId: number) => {
    const auction = auctions?.find(a => a.id === auctionId);
    return auction?.name || "Unknown";
  };

  const toggleExpand = (id: number) => {
    if (expandedRunlistId === id) {
      setExpandedRunlistId(null);
    } else {
      setExpandedRunlistId(id);
    }
  };
  
  const processMutation = useMutation({
    mutationFn: async (runlistId: number) => {
      const response = await fetch(`/api/runlists/${runlistId}/process`, {
        method: "POST",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process runlist");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/runlists"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      
      toast({
        title: "Runlist processed successfully",
        description: `Processed ${data.vehicle_count} vehicles with ${data.match_count} matches found.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Processing failed",
        description: error instanceof Error ? error.message : "Failed to process runlist",
        variant: "destructive"
      });
    },
  });
  
  const processRunlist = (id: number) => {
    processMutation.mutate(id);
  };

  return (
    <>
      <Helmet>
        <title>Runlists | AutoInspect Pro</title>
        <link 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" 
          rel="stylesheet"
        />
      </Helmet>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Runlists</h1>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
          <div>
              <Card>
                <CardHeader>
                  <CardTitle>Uploaded Runlists</CardTitle>
                </CardHeader>
                <CardContent>
                  {isRunlistsLoading ? (
                    <div className="space-y-4">
                      {[...Array(5)].map((_, idx) => (
                        <div key={idx} className="flex flex-col space-y-2">
                          <Skeleton className="h-6 w-1/2" />
                          <Skeleton className="h-4 w-full" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Filename</TableHead>
                          <TableHead>Auction</TableHead>
                          <TableHead>Upload Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {runlists && runlists.length > 0 ? (
                          runlists.map((runlist) => (
                            <TableRow key={runlist.id}>
                              <TableCell className="font-medium">{runlist.filename}</TableCell>
                              <TableCell>{getAuctionName(runlist.auction_id)}</TableCell>
                              <TableCell>{format(new Date(runlist.upload_date), "MMM d, yyyy")}</TableCell>
                              <TableCell>
                                <Badge variant={runlist.processed ? "default" : "outline"}>
                                  {runlist.processed ? "Processed" : "Pending"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => toggleExpand(runlist.id)}
                                  >
                                    {expandedRunlistId === runlist.id ? "Hide" : "View"}
                                  </Button>
                                  {!runlist.processed && (
                                    <Button 
                                      size="sm"
                                      onClick={() => processRunlist(runlist.id)}
                                    >
                                      Process
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                              No runlists found. Upload a runlist to get started.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
          </div>
        </div>
      </div>
    </>
  );
}
