import { useState } from "react";
import { Helmet } from "react-helmet";
import { Link } from "wouter";
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Auction } from "@/lib/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatDistanceToNow } from "date-fns";

const formSchema = z.object({
  name: z.string().min(1, "Auction name is required"),
  description: z.string().optional(),
  location: z.string().min(1, "Auction location is required"),
  address: z.string().min(1, "Auction address is required"),
});

type FormValues = z.infer<typeof formSchema>;

export default function Auctions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddAuctionModalOpen, setIsAddAuctionModalOpen] = useState(false);

  const { data: auctions, isLoading } = useQuery<Auction[]>({
    queryKey: ["/api/auctions"],
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      location: "",
      address: "",
    },
  });

  const createAuctionMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const response = await apiRequest("POST", "/api/auctions", values);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auctions"] });
      toast({
        title: "Auction created",
        description: "Auction has been created successfully.",
      });
      form.reset();
      setIsAddAuctionModalOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create auction",
        variant: "destructive",
      });
    },
  });

  const deleteAuctionMutation = useMutation({
    mutationFn: async (auctionId: number) => {
      const response = await apiRequest("DELETE", `/api/auctions/${auctionId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auctions"] });
      toast({
        title: "Auction deleted",
        description: "Auction has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete auction",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    createAuctionMutation.mutate(values);
  };

  return (
    <>
      <Helmet>
        <title>Auctions | AutoInspect Pro</title>
        <link 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" 
          rel="stylesheet"
        />
      </Helmet>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">Auctions</h1>
            <Button onClick={() => setIsAddAuctionModalOpen(true)}>
              <i className="fas fa-plus mr-2"></i>
              Add Auction
            </Button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Auction Management</CardTitle>
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
                        <TableHead>Auction Name</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Assigned Inspectors</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auctions && auctions.length > 0 ? (
                        auctions.map((auction) => (
                          <TableRow key={auction.id}>
                            <TableCell className="font-medium">{auction.name}</TableCell>
                            <TableCell>{auction.location}</TableCell>
                            <TableCell>{auction.address}</TableCell>
                            <TableCell className="text-center">
                              <Badge>{auction.inspector_count || 0}</Badge>
                            </TableCell>
                            <TableCell>
                              {auction.created_at ? formatDistanceToNow(new Date(auction.created_at), { addSuffix: true }) : 'Recently'}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Link href={`/auctions/${auction.id}`}>
                                  <Button variant="outline" size="sm">View</Button>
                                </Link>
                                <Link href={`/auctions/${auction.id}`}>
                                  <Button variant="outline" size="sm">Manage</Button>
                                </Link>
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={() => {
                                    if (window.confirm(`Are you sure you want to delete "${auction.name}"? This action cannot be undone.`)) {
                                      deleteAuctionMutation.mutate(auction.id);
                                    }
                                  }}
                                  disabled={deleteAuctionMutation.isPending}
                                >
                                  <i className="fas fa-trash mr-1"></i>
                                  Delete
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                            No auctions found. Add an auction to get started.
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

      <Dialog open={isAddAuctionModalOpen} onOpenChange={setIsAddAuctionModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Auction</DialogTitle>
            <DialogDescription>
              Create a new auction location where inspectors will conduct vehicle assessments.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Auction Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter auction name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="City, State" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Full street address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Additional details about this auction" 
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddAuctionModalOpen(false)}
                  disabled={createAuctionMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createAuctionMutation.isPending}
                >
                  {createAuctionMutation.isPending ? "Creating..." : "Add Auction"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}