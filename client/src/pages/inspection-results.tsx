import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Link, useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Check,
  FileText,
  Image,
  Loader2,
  Search,
  Video,
  X,
} from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";

export default function InspectionResultsPage() {
  const [, navigate] = useLocation();
  const [statusFilter, setStatusFilter] = useState<string>("completed");
  const [auctionFilter, setAuctionFilter] = useState<string>("all_locations");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [vinSearch, setVinSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;

  // Fetch auctions for filter dropdown
  const { data: auctions, isLoading: isLoadingAuctions } = useQuery({
    queryKey: ["/api/auctions"],
  });

  // Build URL parameters for inspections API
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
    if (auctionFilter && auctionFilter !== "all_locations") params.append("auctionId", auctionFilter);
    if (startDate) params.append("startDate", startDate.toISOString());
    if (endDate) params.append("endDate", endDate.toISOString());
    if (vinSearch && vinSearch.length >= 6) {
      params.append("vinLast6", vinSearch.slice(-6));
    }
    return params.toString();
  };

  // Fetch inspections with filters
  const {
    data: inspections,
    isLoading: isLoadingInspections,
    error,
  } = useQuery({
    queryKey: [`/api/inspections?${buildQueryParams()}`],
    // Add retry logic and timeout to handle server issues
    retry: 3,
    staleTime: 30000,
  });

  // Apply pagination
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentInspections = inspections?.slice(startIndex, endIndex) || [];
  const totalPages = inspections ? Math.ceil(inspections.length / pageSize) : 0;

  const resetFilters = () => {
    setStatusFilter("completed");
    setAuctionFilter("all_locations");
    setStartDate(undefined);
    setEndDate(undefined);
    setVinSearch("");
    setPage(1);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const dateToString = (date: Date | null | undefined) => {
    if (!date) return "—";
    return format(new Date(date), "MMM d, yyyy");
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inspection Results</h1>
          <p className="text-muted-foreground mt-1">
            Review completed inspections and their results
          </p>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Filter inspection results by various criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Auction Location</label>
              <Select value={auctionFilter} onValueChange={setAuctionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_locations">All Locations</SelectItem>
                  {auctions?.map((auction: any) => (
                    <SelectItem key={auction.id} value={auction.id.toString()}>
                      {auction.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <div className="flex items-center space-x-2">
                <DatePicker
                  selected={startDate}
                  onSelect={setStartDate}
                  className="flex-1"
                  placeholder="From"
                />
                <span>to</span>
                <DatePicker
                  selected={endDate}
                  onSelect={setEndDate}
                  className="flex-1"
                  placeholder="To"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">VIN Search (Last 6)</label>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Enter last 6 digits"
                    value={vinSearch}
                    onChange={(e) => setVinSearch(e.target.value)}
                    className="pl-8"
                    maxLength={6}
                  />
                </div>
                <Button variant="outline" onClick={resetFilters}>
                  Reset
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Inspection Results</CardTitle>
            <div className="flex items-center space-x-2">
              {isLoadingInspections && (
                <Loader2 className="animate-spin h-4 w-4 text-muted-foreground mr-2" />
              )}
              <span className="text-sm text-muted-foreground">
                {inspections?.length || 0} results
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingInspections ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="py-10 text-center">
              <p className="text-red-500">Error loading inspections</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => window.location.reload()}
              >
                Try Again
              </Button>
            </div>
          ) : inspections?.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-muted-foreground">No inspections found</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={resetFilters}
              >
                Reset Filters
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>VIN</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Dealer</TableHead>
                    <TableHead>Inspector</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assets</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentInspections.map((inspection: any) => (
                    <TableRow key={inspection.id}>
                      <TableCell className="font-medium">
                        {dateToString(inspection.completion_date || inspection.start_date || inspection.created_at)}
                      </TableCell>
                      <TableCell>
                        {inspection.vehicle?.vin ? (
                          <span className="font-mono">
                            {inspection.vehicle.vin.slice(-6)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        {inspection.vehicle ? (
                          <div className="flex flex-col">
                            <span>{inspection.vehicle.year} {inspection.vehicle.make} {inspection.vehicle.model}</span>
                            <span className="text-xs text-muted-foreground">
                              {inspection.vehicle.lane_number && `Lane: ${inspection.vehicle.lane_number}`}
                              {inspection.vehicle.run_number && `, Run: ${inspection.vehicle.run_number}`}
                            </span>
                          </div>
                        ) : (
                          "Unknown Vehicle"
                        )}
                      </TableCell>
                      <TableCell>
                        {inspection.dealer?.name || "Unknown Dealer"}
                      </TableCell>
                      <TableCell>
                        {inspection.inspector?.user?.username || "Unassigned"}
                      </TableCell>
                      <TableCell>{getStatusBadge(inspection.status)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Image className="h-3 w-3" />
                            <span>1</span>
                          </Badge>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Video className="h-3 w-3" />
                            <span>2</span>
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/inspection-detail/${inspection.id}`)}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault();
                            if (page > 1) setPage(page - 1);
                          }}
                          className={page === 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      
                      {/* First page */}
                      {page > 2 && (
                        <PaginationItem>
                          <PaginationLink 
                            href="#" 
                            onClick={(e) => {
                              e.preventDefault();
                              setPage(1);
                            }}
                          >
                            1
                          </PaginationLink>
                        </PaginationItem>
                      )}
                      
                      {/* Ellipsis */}
                      {page > 3 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                      
                      {/* Previous page */}
                      {page > 1 && (
                        <PaginationItem>
                          <PaginationLink 
                            href="#" 
                            onClick={(e) => {
                              e.preventDefault();
                              setPage(page - 1);
                            }}
                          >
                            {page - 1}
                          </PaginationLink>
                        </PaginationItem>
                      )}
                      
                      {/* Current page */}
                      <PaginationItem>
                        <PaginationLink href="#" isActive>
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                      
                      {/* Next page */}
                      {page < totalPages && (
                        <PaginationItem>
                          <PaginationLink 
                            href="#" 
                            onClick={(e) => {
                              e.preventDefault();
                              setPage(page + 1);
                            }}
                          >
                            {page + 1}
                          </PaginationLink>
                        </PaginationItem>
                      )}
                      
                      {/* Ellipsis */}
                      {page < totalPages - 2 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                      
                      {/* Last page */}
                      {page < totalPages - 1 && (
                        <PaginationItem>
                          <PaginationLink 
                            href="#" 
                            onClick={(e) => {
                              e.preventDefault();
                              setPage(totalPages);
                            }}
                          >
                            {totalPages}
                          </PaginationLink>
                        </PaginationItem>
                      )}
                      
                      <PaginationItem>
                        <PaginationNext 
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault();
                            if (page < totalPages) setPage(page + 1);
                          }}
                          className={page === totalPages ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}