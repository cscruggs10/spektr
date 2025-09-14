import { useState } from "react";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
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
import { Dealer, BuyBoxItem } from "@/lib/types";
import AddVehicleModal from "@/components/modals/add-vehicle-modal";
import DuplicateBuyBoxModal from "@/components/modals/duplicate-buy-box-modal";

export default function BuyBox() {
  const [selectedDealerId, setSelectedDealerId] = useState<string>("all");
  const [isAddVehicleModalOpen, setIsAddVehicleModalOpen] = useState(false);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [selectedBuyBoxItem, setSelectedBuyBoxItem] = useState<BuyBoxItem | null>(null);

  const { data: dealers, isLoading: isDealersLoading } = useQuery<Dealer[]>({
    queryKey: ["/api/dealers"],
  });

  const { data: buyBoxItems, isLoading: isBuyBoxItemsLoading } = useQuery<BuyBoxItem[]>({
    queryKey: ["/api/buy-box", selectedDealerId && selectedDealerId !== "all" ? parseInt(selectedDealerId) : undefined],
    queryFn: async ({ queryKey }) => {
      const [_, dealerId] = queryKey;
      const url = dealerId ? `/api/buy-box?dealerId=${dealerId}` : "/api/buy-box";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch buy box items");
      return response.json();
    }
  });

  return (
    <>
      <Helmet>
        <title>Buy Box | AutoInspect Pro</title>
        <link 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" 
          rel="stylesheet"
        />
      </Helmet>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">Buy Box</h1>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => {
                  const dealerParam = selectedDealerId !== "all" ? `?dealerId=${selectedDealerId}` : '';
                  window.open(`/api/buy-box/export${dealerParam}`, '_blank');
                }}
              >
                <i className="fas fa-file-excel mr-2"></i>
                Export to Excel
              </Button>
              <Button onClick={() => setIsAddVehicleModalOpen(true)}>
                <i className="fas fa-plus mr-2"></i>
                Add Vehicle
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center space-y-2 sm:space-y-0">
              <CardTitle>Vehicle Inventory Preferences</CardTitle>
              <div className="w-full sm:w-64">
                <Select 
                  value={selectedDealerId} 
                  onValueChange={setSelectedDealerId}
                  defaultValue=""
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by dealer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Dealers</SelectItem>
                    {isDealersLoading ? (
                      <SelectItem value="loading" disabled>Loading dealers...</SelectItem>
                    ) : dealers && dealers.length > 0 ? (
                      dealers.filter(d => d.status === "active").map((dealer) => (
                        <SelectItem key={dealer.id} value={dealer.id.toString()}>
                          {dealer.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>No dealers found</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {isBuyBoxItemsLoading ? (
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
                        <TableHead>Dealer</TableHead>
                        <TableHead>Make</TableHead>
                        <TableHead>Model</TableHead>
                        <TableHead>Trim</TableHead>
                        <TableHead>Year Range</TableHead>
                        <TableHead>Mileage Range</TableHead>
                        <TableHead>Price Range</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {buyBoxItems && buyBoxItems.length > 0 ? (
                        buyBoxItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">
                              {dealers?.find(d => d.id === item.dealer_id)?.name || `Dealer #${item.dealer_id}`}
                            </TableCell>
                            <TableCell>{item.make}</TableCell>
                            <TableCell>{item.model}</TableCell>
                            <TableCell>{item.trim || "Any"}</TableCell>
                            <TableCell>
                              {item.year_min && item.year_max 
                                ? `${item.year_min} - ${item.year_max}` 
                                : item.year_min 
                                  ? `Min: ${item.year_min}` 
                                  : item.year_max 
                                    ? `Max: ${item.year_max}` 
                                    : "Any"}
                            </TableCell>
                            <TableCell>
                              {item.mileage_min && item.mileage_max 
                                ? `${item.mileage_min} - ${item.mileage_max}` 
                                : item.mileage_min 
                                  ? `Min: ${item.mileage_min}` 
                                  : item.mileage_max 
                                    ? `Max: ${item.mileage_max}` 
                                    : "Any"}
                            </TableCell>
                            <TableCell>
                              {item.price_min && item.price_max 
                                ? `$${item.price_min.toLocaleString()} - $${item.price_max.toLocaleString()}` 
                                : item.price_min 
                                  ? `Min: $${item.price_min.toLocaleString()}` 
                                  : item.price_max 
                                    ? `Max: $${item.price_max.toLocaleString()}` 
                                    : "Any"}
                            </TableCell>
                            <TableCell>
                              <Badge variant={item.status === "active" ? "default" : "secondary"}>
                                {item.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2 flex-wrap">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  title="Duplicate to another dealer"
                                  onClick={() => {
                                    setSelectedBuyBoxItem(item);
                                    setIsDuplicateModalOpen(true);
                                  }}
                                >
                                  <i className="fas fa-copy mr-1"></i> Duplicate
                                </Button>
                                <Button variant="outline" size="sm">Edit</Button>
                                <Button variant="destructive" size="sm">Delete</Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-4 text-gray-500">
                            No buy box items found. Add a vehicle to get started.
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

      <AddVehicleModal 
        isOpen={isAddVehicleModalOpen} 
        onClose={() => setIsAddVehicleModalOpen(false)} 
      />
      
      <DuplicateBuyBoxModal
        isOpen={isDuplicateModalOpen}
        onClose={() => setIsDuplicateModalOpen(false)}
        buyBoxItem={selectedBuyBoxItem}
      />
    </>
  );
}
