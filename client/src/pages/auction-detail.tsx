import { useState } from "react";
import { useParams, Link } from "wouter";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar, Clock, MapPin, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Auction } from "@/lib/types";
import AuctionSchedules from "@/components/auction-schedules";

export default function AuctionDetail() {
  const { id } = useParams<{ id: string }>();
  const auctionId = parseInt(id);

  const { data: auction, isLoading } = useQuery<Auction>({
    queryKey: [`/api/auctions/${auctionId}`],
    queryFn: async () => {
      const response = await fetch(`/api/auctions/${auctionId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch auction details");
      }
      return response.json();
    },
    enabled: !isNaN(auctionId),
  });

  if (isNaN(auctionId)) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-10">
        <h1 className="text-2xl font-semibold text-red-600">Invalid auction ID</h1>
        <Link href="/auctions">
          <Button variant="link" className="mt-4 pl-0">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to auctions
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{auction?.name || "Auction Details"} | AutoInspect Pro</title>
      </Helmet>

      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex items-center">
            <Link href="/auctions">
              <Button variant="outline" size="sm" className="mr-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
            <h1 className="text-2xl font-semibold text-gray-900">
              {isLoading ? <Skeleton className="h-8 w-64" /> : auction?.name}
            </h1>
          </div>
          
          {isLoading ? (
            <div className="mt-6 space-y-6">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : auction ? (
            <div className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Auction Information</CardTitle>
                  <CardDescription>Details about this auction location</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Description</h3>
                    <p className="mt-1 text-sm text-gray-900">{auction.description || "No description provided"}</p>
                    
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center text-sm">
                        <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                        <span>{auction.location}, {auction.address}</span>
                      </div>

                      <div className="flex items-center text-sm">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        <span>Created {formatDistanceToNow(new Date(auction.created_at), { addSuffix: true })}</span>
                      </div>

                      <div className="flex items-center text-sm">
                        <Users className="h-4 w-4 text-gray-400 mr-2" />
                        <span>
                          {auction.inspector_count || 0} Inspector{auction.inspector_count !== 1 ? 's' : ''} assigned
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Tabs defaultValue="schedules" className="mt-6">
                <TabsList>
                  <TabsTrigger value="schedules">Schedules</TabsTrigger>
                  <TabsTrigger value="inspectors">Inspectors</TabsTrigger>
                  <TabsTrigger value="runlists">Runlists</TabsTrigger>
                </TabsList>
                <TabsContent value="schedules">
                  <AuctionSchedules auctionId={auctionId} />
                </TabsContent>
                <TabsContent value="inspectors">
                  <Card>
                    <CardHeader>
                      <CardTitle>Assigned Inspectors</CardTitle>
                      <CardDescription>Manage inspectors for this auction</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-10 text-muted-foreground">
                        <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
                        <h3 className="mt-4 text-lg font-semibold">Inspector management</h3>
                        <p className="mt-2 text-sm">This feature will be implemented soon.</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="runlists">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Runlists</CardTitle>
                      <CardDescription>View and upload runlists for this auction</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-10 text-muted-foreground">
                        <Clock className="mx-auto h-12 w-12 text-muted-foreground/50" />
                        <h3 className="mt-4 text-lg font-semibold">Runlist management</h3>
                        <p className="mt-2 text-sm">The runlists feature will be implemented soon.</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="mt-10 text-center">
              <h2 className="text-lg font-medium text-red-600">Failed to load auction</h2>
              <p className="mt-2 text-gray-500">The requested auction could not be found or there was an error.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}