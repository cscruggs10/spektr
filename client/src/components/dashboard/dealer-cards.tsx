import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dealer } from "@/lib/types";
import { format } from "date-fns";

export default function DealerCards() {
  const { data: dealers, isLoading } = useQuery<Dealer[]>({
    queryKey: ["/api/dealers"],
  });

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM yyyy");
  };

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg leading-6 font-medium text-gray-900">Active Dealers</h2>
        <Button>
          <i className="fas fa-plus mr-2"></i>
          Add Dealer
        </Button>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="bg-white shadow overflow-hidden sm:rounded-lg">
              <CardHeader className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <div>
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </CardHeader>
              <CardContent className="border-t border-gray-200 px-4 py-5 sm:p-0">
                <dl className="sm:divide-y sm:divide-gray-200">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="py-3 sm:py-4 sm:grid sm:grid-cols-2 sm:gap-4 sm:px-6">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-8" />
                    </div>
                  ))}
                </dl>
              </CardContent>
              <CardFooter className="bg-gray-50 px-4 py-3 border-t border-gray-200 sm:px-6">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dealers?.filter(dealer => dealer.status === "active").slice(0, 3).map((dealer) => (
            <Card key={dealer.id} className="bg-white shadow overflow-hidden sm:rounded-lg">
              <CardHeader className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg leading-6 font-medium text-gray-900">{dealer.name}</CardTitle>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">Joined: {formatDate(dealer.joined_date)}</p>
                </div>
                <div className="bg-green-100 px-2 py-1 rounded-full text-xs font-medium text-green-800">Active</div>
              </CardHeader>
              <CardContent className="border-t border-gray-200 px-4 py-5 sm:p-0">
                <dl className="sm:divide-y sm:divide-gray-200">
                  <div className="py-3 sm:py-4 sm:grid sm:grid-cols-2 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Buy Box Items</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0">--</dd>
                  </div>
                  <div className="py-3 sm:py-4 sm:grid sm:grid-cols-2 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Purchases (30 days)</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0">--</dd>
                  </div>
                  <div className="py-3 sm:py-4 sm:grid sm:grid-cols-2 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Inspection Accuracy</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0">--</dd>
                  </div>
                </dl>
              </CardContent>
              <CardFooter className="bg-gray-50 px-4 py-3 border-t border-gray-200 sm:px-6">
                <div className="flex justify-between">
                  <a href="#" className="text-sm font-medium text-primary hover:text-primary-darker">View Details</a>
                  <a href="#" className="text-sm font-medium text-primary hover:text-primary-darker">Manage Buy Box</a>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
