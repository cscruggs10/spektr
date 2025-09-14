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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import AddDealerModal from "@/components/modals/add-dealer-modal";
import { Dealer } from "@shared/schema";
import { format } from "date-fns";

export default function Dealers() {
  const [isAddDealerModalOpen, setIsAddDealerModalOpen] = useState(false);

  const { data: dealers, isLoading } = useQuery<Dealer[]>({
    queryKey: ["/api/dealers"],
  });

  return (
    <>
      <Helmet>
        <title>Dealers | AutoInspect Pro</title>
        <link 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" 
          rel="stylesheet"
        />
      </Helmet>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">Dealers</h1>
            <Button onClick={() => setIsAddDealerModalOpen(true)}>
              <i className="fas fa-plus mr-2"></i>
              Add Dealer
            </Button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Dealer Management</CardTitle>
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
                        <TableHead>Name</TableHead>
                        <TableHead>Contact Person</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dealers && dealers.length > 0 ? (
                        dealers.map((dealer) => (
                          <TableRow key={dealer.id}>
                            <TableCell className="font-medium">{dealer.name}</TableCell>
                            <TableCell>{dealer.contact_name}</TableCell>
                            <TableCell>{dealer.contact_email}</TableCell>
                            <TableCell>{dealer.contact_phone || "—"}</TableCell>
                            <TableCell>
                              <Badge variant={dealer.status === "active" ? "default" : "secondary"} 
                                className={dealer.status === "active" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" : ""}>
                                {dealer.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{format(new Date(dealer.joined_date), "MMM d, yyyy")}</TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm">View</Button>
                                <Button variant="outline" size="sm">Manage Buy Box</Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-4 text-gray-500">
                            No dealers found. Add a dealer to get started.
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

      {/* Add Dealer Modal */}
      <AddDealerModal 
        isOpen={isAddDealerModalOpen} 
        onClose={() => setIsAddDealerModalOpen(false)} 
      />
    </>
  );
}
