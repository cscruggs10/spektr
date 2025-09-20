import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Eye, Calendar, User, Car, FileCheck, DollarSign, Search, Filter, Star } from "lucide-react";
import { format, subDays, isAfter } from "date-fns";
import { useState, useMemo } from "react";

export default function CompletedInspections() {
  const [, navigate] = useLocation();
  const [expandedInspection, setExpandedInspection] = useState<number | null>(null);
  const [vinSearch, setVinSearch] = useState("");
  const [selectedInspectorId, setSelectedInspectorId] = useState<string>("all");
  const [selectedDays, setSelectedDays] = useState<string>("all");
  const [selectedAuctionId, setSelectedAuctionId] = useState<string>("all");
  const [laneSearch, setLaneSearch] = useState("");
  const [runSearch, setRunSearch] = useState("");

  const { data: allInspections, isLoading } = useQuery({
    queryKey: ["/api/inspections?status=completed"],
  });

  const { data: results } = useQuery({
    queryKey: ["/api/inspection-results"],
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
  }, [allInspections, vinSearch, selectedInspectorId, selectedAuctionId, selectedDays, laneSearch, runSearch]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  const getResultForInspection = (inspectionId: number) => {
    return results?.find((r: any) => r.inspection_id === inspectionId);
  };

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
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
            </div>

            {/* Active Filters Summary */}
            {(vinSearch || selectedInspectorId !== "all" || selectedAuctionId !== "all" || selectedDays !== "all" || laneSearch || runSearch) && (
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
                  }}
                  className="ml-auto text-xs"
                >
                  Clear all
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {!inspections || inspections.length === 0 ? (
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
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  {inspections.length} completed inspection{inspections.length !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Auction</TableHead>
                      <TableHead className="w-[100px]">Lane</TableHead>
                      <TableHead className="w-[100px]">Run</TableHead>
                      <TableHead className="w-[150px]">Date</TableHead>
                      <TableHead className="w-[200px]">Vehicle</TableHead>
                      <TableHead className="w-[150px]">Inspector</TableHead>
                      <TableHead className="w-[120px]">Status</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inspections.map((inspection: any) => {
                      const result = getResultForInspection(inspection.id);
                      const auction = auctions?.find((a: any) => a.id === inspection.vehicle?.runlist?.auction_id);

                      return (
                        <TableRow
                          key={inspection.id}
                          className={`hover:bg-muted/50 ${
                            inspection.is_recommended
                              ? 'bg-green-50 border-l-4 border-green-500'
                              : ''
                          }`}
                        >
                          <TableCell className="font-medium">
                            {auction?.name || 'Unknown Auction'}
                          </TableCell>
                          <TableCell>
                            {inspection.vehicle?.lane_number || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {inspection.vehicle?.run_number || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {inspection.completion_date
                              ? format(new Date(inspection.completion_date), "MMM d, yyyy")
                              : "Recently"}
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
                          <TableCell>
                            {inspection.inspector?.user?.name || "Unknown"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                COMPLETED
                              </Badge>
                              {inspection.is_recommended && (
                                <Badge variant="default" className="bg-gradient-to-r from-green-600 to-emerald-600 text-white flex items-center">
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
                              onClick={() => setExpandedInspection(
                                expandedInspection === inspection.id ? null : inspection.id
                              )}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              {expandedInspection === inspection.id ? 'Hide' : 'View'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Expanded details section */}
              {expandedInspection && inspections.find((i: any) => i.id === expandedInspection) && (
                <div className="mt-6 pt-6 border-t space-y-6">
                  {(() => {
                    const inspection = inspections.find((i: any) => i.id === expandedInspection);
                    const result = getResultForInspection(inspection.id);

                    return (
                      <>
                        <h4 className="text-xl font-bold text-gray-900">Complete Inspection Data</h4>

                        {/* Vehicle Details */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h5 className="font-bold mb-3 text-gray-800">Vehicle Information</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div><span className="font-medium">Year:</span> {inspection.vehicle?.year || "Unknown"}</div>
                            <div><span className="font-medium">Make:</span> {inspection.vehicle?.make || "Unknown"}</div>
                            <div><span className="font-medium">Model:</span> {inspection.vehicle?.model || "Unknown"}</div>
                            <div><span className="font-medium">Color:</span> {inspection.vehicle?.color || "Unknown"}</div>
                            <div><span className="font-medium">VIN:</span> {inspection.vehicle?.vin || "Unknown"}</div>
                            <div><span className="font-medium">Lane:</span> {inspection.vehicle?.lane_number || "Unknown"}</div>
                            <div><span className="font-medium">Run:</span> {inspection.vehicle?.run_number || "Unknown"}</div>
                            <div><span className="font-medium">Stock #:</span> {inspection.vehicle?.stock_number || "Unknown"}</div>
                          </div>
                        </div>

                        {/* Notes */}
                        {inspection.notes && (
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <h6 className="font-medium text-sm mb-1">Inspection Notes:</h6>
                            {(() => {
                              const notes = inspection.notes;
                              const voiceNoteMatch = notes.match(/\[VOICE_NOTE\](.*?)\[\/VOICE_NOTE\]/);

                              if (voiceNoteMatch) {
                                const voiceUrl = voiceNoteMatch[1];
                                const textNotes = notes.replace(/\[VOICE_NOTE\].*?\[\/VOICE_NOTE\]/g, '').trim();

                                return (
                                  <div className="space-y-2">
                                    {textNotes && (
                                      <p className="text-sm text-gray-700">{textNotes}</p>
                                    )}
                                    <div className="bg-indigo-100 p-2 rounded">
                                      <p className="text-xs text-indigo-700 mb-1">Voice Note:</p>
                                      <audio controls className="w-full">
                                        <source src={voiceUrl} type="audio/mp4" />
                                        <source src={voiceUrl} type="audio/webm" />
                                        Your browser does not support audio playback.
                                      </audio>
                                    </div>
                                  </div>
                                );
                              } else {
                                return <p className="text-sm text-gray-700">{notes}</p>;
                              }
                            })()}
                          </div>
                        )}

                        {/* PHOTOS */}
                        {result?.photos && result.photos.length > 0 && (
                          <div className="bg-green-50 p-4 rounded-lg">
                            <h5 className="font-bold mb-3 text-green-800">Photos ({result.photos.length})</h5>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                              {result.photos.map((photo: string, index: number) => (
                                <div key={index} className="bg-white p-2 rounded shadow">
                                  <img
                                    src={photo}
                                    alt={`Photo ${index + 1}`}
                                    className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-80"
                                    onClick={() => window.open(photo, '_blank')}
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                  <p className="text-xs text-center mt-1 text-gray-600">Photo {index + 1}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* VIDEOS */}
                        {result?.videos && result.videos.length > 0 && (
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <h5 className="font-bold mb-3 text-blue-800">Videos ({result.videos.length})</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {result.videos.map((video: string, index: number) => (
                                <div key={index} className="bg-white p-2 rounded shadow">
                                  <video
                                    src={video}
                                    controls
                                    className="w-full h-48 rounded"
                                    preload="metadata"
                                  >
                                    Your browser does not support video playback.
                                  </video>
                                  <p className="text-xs text-center mt-1 text-gray-600">Video {index + 1}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* No data message */}
                        {(!result || (!result.photos?.length && !result.videos?.length)) && (
                          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                            <FileCheck className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>No media files found for this inspection.</p>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}