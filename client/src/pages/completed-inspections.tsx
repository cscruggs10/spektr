import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Eye, Calendar, User, Car, FileCheck, DollarSign, Search, Filter, Star, Package } from "lucide-react";
import { format, subDays, isAfter } from "date-fns";
import { useState, useMemo } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function CompletedInspections() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [vinSearch, setVinSearch] = useState("");
  const [selectedInspectorId, setSelectedInspectorId] = useState<string>("all");
  const [selectedDays, setSelectedDays] = useState<string>("all");
  const [selectedAuctionId, setSelectedAuctionId] = useState<string>("all");
  const [laneSearch, setLaneSearch] = useState("");
  const [runSearch, setRunSearch] = useState("");
  const [reviewedFilter, setReviewedFilter] = useState<string>("all"); // all, reviewed, unreviewed

  const { data: allInspections, isLoading } = useQuery({
    queryKey: ["/api/inspections?status=completed"],
  });


  const { data: inspectors } = useQuery({
    queryKey: ["/api/inspectors"],
  });

  const { data: auctions } = useQuery({
    queryKey: ["/api/auctions"],
  });

  // Filter inspections based on search and filters
  const inspections = useMemo(() => {
    if (!allInspections) return [];
    
    let filtered = [...allInspections];
    
    // Filter by VIN (last 6 characters)
    if (vinSearch.trim()) {
      filtered = filtered.filter((inspection: any) => {
        const vin = inspection.vehicle?.vin || "";
        const searchTerm = vinSearch.trim().toUpperCase();
        // Check if search term matches last 6 characters of VIN
        return vin.toUpperCase().endsWith(searchTerm) || 
               vin.toUpperCase().includes(searchTerm);
      });
    }
    
    // Filter by inspector
    if (selectedInspectorId !== "all") {
      filtered = filtered.filter((inspection: any) => 
        inspection.inspector_id === parseInt(selectedInspectorId)
      );
    }
    
    // Filter by auction
    if (selectedAuctionId !== "all") {
      filtered = filtered.filter((inspection: any) => {
        const auctionId = inspection.vehicle?.runlist?.auction_id || inspection.auction_id;
        return auctionId === parseInt(selectedAuctionId);
      });
    }

    // Filter by lane number
    if (laneSearch.trim()) {
      filtered = filtered.filter((inspection: any) => {
        const laneNumber = inspection.vehicle?.lane_number || "";
        return laneNumber.toLowerCase().includes(laneSearch.trim().toLowerCase());
      });
    }

    // Filter by run number
    if (runSearch.trim()) {
      filtered = filtered.filter((inspection: any) => {
        const runNumber = inspection.vehicle?.run_number || "";
        return runNumber.toLowerCase().includes(runSearch.trim().toLowerCase());
      });
    }
    
    // Filter by days
    if (selectedDays !== "all") {
      const days = parseInt(selectedDays);
      const cutoffDate = subDays(new Date(), days);
      filtered = filtered.filter((inspection: any) => {
        const completionDate = inspection.completion_date ? new Date(inspection.completion_date) : null;
        return completionDate && isAfter(completionDate, cutoffDate);
      });
    }

    // Filter by reviewed status
    if (reviewedFilter !== "all") {
      filtered = filtered.filter((inspection: any) => {
        if (reviewedFilter === "reviewed") {
          return inspection.reviewed === true;
        } else if (reviewedFilter === "unreviewed") {
          return !inspection.reviewed;
        }
        return true;
      });
    }

    // Sort by completion date (newest first) and then by recommendation
    return filtered.sort((a: any, b: any) => {
      // First sort by recommendation status
      if (a.is_recommended && !b.is_recommended) return -1;
      if (!a.is_recommended && b.is_recommended) return 1;

      // Then sort by completion date
      const dateA = new Date(a.completion_date || 0);
      const dateB = new Date(b.completion_date || 0);
      return dateB.getTime() - dateA.getTime();
    });
  }, [allInspections, vinSearch, selectedInspectorId, selectedAuctionId, selectedDays, laneSearch, runSearch, reviewedFilter]);

  // Group inspections into packages by auction_id + auction_start_date
  const inspectionPackages = useMemo(() => {
    if (!inspections || inspections.length === 0) return [];

    const packagesMap = new Map<string, any>();
    const ungroupedInspections: any[] = [];

    inspections.forEach((inspection: any) => {
      const auctionId = inspection.vehicle?.runlist?.auction_id;
      const auctionStartDate = inspection.auction_start_date;

      // If missing required data, add to ungrouped section
      if (!auctionId || !auctionStartDate) {
        ungroupedInspections.push(inspection);
        return;
      }

      // Create a unique key for this package
      const packageKey = `${auctionId}-${auctionStartDate}`;

      if (!packagesMap.has(packageKey)) {
        const auction = auctions?.find((a: any) => a.id === auctionId);
        packagesMap.set(packageKey, {
          packageKey,
          auctionId,
          auctionStartDate,
          auctionName: auction?.name || "Unknown Auction",
          auctionLocation: auction?.location || "",
          inspections: [],
        });
      }

      packagesMap.get(packageKey).inspections.push(inspection);
    });

    // Convert map to array and sort inspections within each package
    const packages = Array.from(packagesMap.values()).map(pkg => ({
      ...pkg,
      inspections: pkg.inspections.sort((a: any, b: any) => {
        // Sort by lane number first, then run number
        const laneA = a.vehicle?.lane_number || "";
        const laneB = b.vehicle?.lane_number || "";
        const runA = a.vehicle?.run_number || "";
        const runB = b.vehicle?.run_number || "";

        if (laneA !== laneB) {
          return laneA.localeCompare(laneB, undefined, { numeric: true });
        }
        return runA.localeCompare(runB, undefined, { numeric: true });
      }),
      totalCount: pkg.inspections.length,
      reviewedCount: pkg.inspections.filter((i: any) => i.reviewed).length,
    })).sort((a, b) => {
      // Sort packages by auction_start_date (newest first)
      return new Date(b.auctionStartDate).getTime() - new Date(a.auctionStartDate).getTime();
    });

    // Add ungrouped inspections as a separate package at the end if any exist
    if (ungroupedInspections.length > 0) {
      packages.push({
        packageKey: 'ungrouped',
        auctionId: null,
        auctionStartDate: null,
        auctionName: "Ungrouped Inspections",
        auctionLocation: "Missing auction or date information",
        inspections: ungroupedInspections.sort((a: any, b: any) => {
          // Sort by completion date (newest first)
          const dateA = new Date(a.completion_date || 0);
          const dateB = new Date(b.completion_date || 0);
          return dateB.getTime() - dateA.getTime();
        }),
        totalCount: ungroupedInspections.length,
        reviewedCount: ungroupedInspections.filter((i: any) => i.reviewed).length,
      });
    }

    return packages;
  }, [inspections, auctions]);

  // Toggle review status mutation
  const toggleReviewMutation = useMutation({
    mutationFn: async (inspectionId: number) => {
      const response = await apiRequest("PATCH", `/api/inspections/${inspectionId}/review`, {});
      if (!response.ok) {
        throw new Error("Failed to update review status");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inspections?status=completed"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update review status",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <FileCheck className="h-8 w-8 mr-3 text-green-600" />
                Completed Inspections
              </h1>
              <p className="text-lg text-muted-foreground mt-1">
                All completed vehicle inspections with complete data
              </p>
            </div>
            <Button onClick={() => navigate("/")}>
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Filters Section */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-8 gap-4">
              {/* VIN Search */}
              <div className="lg:col-span-2">
                <Label htmlFor="vin-search" className="text-sm font-medium">
                  Search by VIN (Last 6)
                </Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="vin-search"
                    type="text"
                    placeholder="Enter last 6 of VIN..."
                    value={vinSearch}
                    onChange={(e) => setVinSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Inspector Filter */}
              <div>
                <Label htmlFor="inspector-filter" className="text-sm font-medium">
                  Inspector
                </Label>
                <Select value={selectedInspectorId} onValueChange={setSelectedInspectorId}>
                  <SelectTrigger id="inspector-filter" className="mt-1">
                    <SelectValue placeholder="All Inspectors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Inspectors</SelectItem>
                    {inspectors?.map((inspector: any) => (
                      <SelectItem key={inspector.id} value={inspector.id.toString()}>
                        {inspector.user?.name || inspector.user?.username || `Inspector ${inspector.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Auction Filter */}
              <div>
                <Label htmlFor="auction-filter" className="text-sm font-medium">
                  Auction
                </Label>
                <Select value={selectedAuctionId} onValueChange={setSelectedAuctionId}>
                  <SelectTrigger id="auction-filter" className="mt-1">
                    <SelectValue placeholder="All Auctions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Auctions</SelectItem>
                    {auctions?.map((auction: any) => (
                      <SelectItem key={auction.id} value={auction.id.toString()}>
                        {auction.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Days Filter */}
              <div>
                <Label htmlFor="days-filter" className="text-sm font-medium">
                  Time Period
                </Label>
                <Select value={selectedDays} onValueChange={setSelectedDays}>
                  <SelectTrigger id="days-filter" className="mt-1">
                    <SelectValue placeholder="All Time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="1">Last 24 hours</SelectItem>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Lane Number Filter */}
              <div>
                <Label htmlFor="lane-search" className="text-sm font-medium">
                  Lane Number
                </Label>
                <Input
                  id="lane-search"
                  type="text"
                  placeholder="Enter lane..."
                  value={laneSearch}
                  onChange={(e) => setLaneSearch(e.target.value)}
                  className="mt-1"
                />
              </div>

              {/* Run Number Filter */}
              <div>
                <Label htmlFor="run-search" className="text-sm font-medium">
                  Run Number
                </Label>
                <Input
                  id="run-search"
                  type="text"
                  placeholder="Enter run..."
                  value={runSearch}
                  onChange={(e) => setRunSearch(e.target.value)}
                  className="mt-1"
                />
              </div>

              {/* Review Status Filter */}
              <div>
                <Label htmlFor="review-filter" className="text-sm font-medium">
                  Review Status
                </Label>
                <Select value={reviewedFilter} onValueChange={setReviewedFilter}>
                  <SelectTrigger id="review-filter" className="mt-1">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="reviewed">Reviewed</SelectItem>
                    <SelectItem value="unreviewed">Unreviewed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active Filters Summary */}
            {(vinSearch || selectedInspectorId !== "all" || selectedAuctionId !== "all" || selectedDays !== "all" || laneSearch || runSearch || reviewedFilter !== "all") && (
              <div className="mt-4 flex items-center gap-2 text-sm">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Active filters:</span>
                {vinSearch && (
                  <Badge variant="secondary" className="text-xs">
                    VIN: {vinSearch}
                  </Badge>
                )}
                {selectedInspectorId !== "all" && (
                  <Badge variant="secondary" className="text-xs">
                    Inspector: {inspectors?.find((i: any) => i.id === parseInt(selectedInspectorId))?.user?.name || "Selected"}
                  </Badge>
                )}
                {selectedAuctionId !== "all" && (
                  <Badge variant="secondary" className="text-xs">
                    Auction: {auctions?.find((a: any) => a.id === parseInt(selectedAuctionId))?.name || "Selected"}
                  </Badge>
                )}
                {selectedDays !== "all" && (
                  <Badge variant="secondary" className="text-xs">
                    Last {selectedDays} days
                  </Badge>
                )}
                {laneSearch && (
                  <Badge variant="secondary" className="text-xs">
                    Lane: {laneSearch}
                  </Badge>
                )}
                {runSearch && (
                  <Badge variant="secondary" className="text-xs">
                    Run: {runSearch}
                  </Badge>
                )}
                {reviewedFilter !== "all" && (
                  <Badge variant="secondary" className="text-xs">
                    Review: {reviewedFilter === "reviewed" ? "Reviewed" : "Unreviewed"}
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setVinSearch("");
                    setSelectedInspectorId("all");
                    setSelectedAuctionId("all");
                    setSelectedDays("all");
                    setLaneSearch("");
                    setRunSearch("");
                    setReviewedFilter("all");
                  }}
                  className="ml-auto text-xs"
                >
                  Clear all
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {!inspectionPackages || inspectionPackages.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileCheck className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-medium mb-2">No Completed Inspections</h3>
              <p className="text-gray-600">
                Completed inspections will appear here once inspectors finish their work.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {inspectionPackages.length} inspection package{inspectionPackages.length !== 1 ? 's' : ''}
                {' '}({inspections.length} total inspection{inspections.length !== 1 ? 's' : ''})
              </p>
            </div>

            {/* Package Cards */}
            {inspectionPackages.map((pkg: any) => (
              <Card key={pkg.packageKey} className="overflow-hidden">
                {/* Package Header */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Package className="h-6 w-6 text-blue-600" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {pkg.auctionName}
                          {pkg.auctionLocation && <span className="text-sm font-normal text-gray-600 ml-2">({pkg.auctionLocation})</span>}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Auction Date: {format(new Date(pkg.auctionStartDate), "MMMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge className="bg-blue-100 text-blue-800">
                        {pkg.totalCount} Inspection{pkg.totalCount !== 1 ? 's' : ''}
                      </Badge>
                      <Badge className="bg-green-100 text-green-800">
                        {pkg.reviewedCount} Reviewed
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Inspections Table */}
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[60px]">Rev.</TableHead>
                        <TableHead className="w-[80px]">Lane</TableHead>
                        <TableHead className="w-[80px]">Run</TableHead>
                        <TableHead className="w-[200px]">Vehicle</TableHead>
                        <TableHead className="w-[120px]">Inspector</TableHead>
                        <TableHead className="w-[100px]">Status</TableHead>
                        <TableHead className="w-[120px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pkg.inspections.map((inspection: any) => (
                        <TableRow
                          key={inspection.id}
                          className={`${
                            inspection.is_recommended
                              ? 'bg-green-50 border-l-4 border-green-500'
                              : inspection.reviewed
                              ? 'bg-gray-50'
                              : ''
                          } hover:bg-muted/50`}
                        >
                          <TableCell>
                            <Checkbox
                              checked={inspection.reviewed}
                              onCheckedChange={() => toggleReviewMutation.mutate(inspection.id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {inspection.vehicle?.lane_number || 'N/A'}
                          </TableCell>
                          <TableCell className="font-medium">
                            {inspection.vehicle?.run_number || 'N/A'}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">
                                {inspection.vehicle?.year || ''} {inspection.vehicle?.make || ''} {inspection.vehicle?.model || 'Vehicle'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                VIN: {inspection.vehicle?.vin || 'Unknown'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {inspection.inspector?.user?.name || "Unknown"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              {inspection.is_recommended && (
                                <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 text-white flex items-center">
                                  <Star className="h-3 w-3 mr-1" />
                                  REC
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/inspection-detail/${inspection.id}`)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}