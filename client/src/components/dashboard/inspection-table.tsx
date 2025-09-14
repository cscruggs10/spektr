import { useQuery } from "@tanstack/react-query";
import { Inspection } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function InspectionTable() {
  const { data: inspections, isLoading } = useQuery<Inspection[]>({
    queryKey: ["/api/dashboard/upcoming-inspections"],
  });

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-yellow-100 text-yellow-800";
      case "in_progress":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "canceled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "Not scheduled";
    
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const isToday = date.getDate() === today.getDate() &&
                    date.getMonth() === today.getMonth() &&
                    date.getFullYear() === today.getFullYear();
    
    const isTomorrow = date.getDate() === tomorrow.getDate() &&
                      date.getMonth() === tomorrow.getMonth() &&
                      date.getFullYear() === tomorrow.getFullYear();
    
    const timeStr = format(date, "h:mm a");
    
    if (isToday) {
      return `Today, ${timeStr}`;
    } else if (isTomorrow) {
      return `Tomorrow, ${timeStr}`;
    } else {
      return format(date, "MMM d, h:mm a");
    }
  };

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg leading-6 font-medium text-gray-900">Upcoming Inspections</h2>
        <div className="flex space-x-3">
          <Button variant="outline" size="sm">
            <i className="fas fa-filter mr-2"></i>
            Filter
          </Button>
          <Button size="sm">
            <i className="fas fa-plus mr-2"></i>
            Assign Inspector
          </Button>
        </div>
      </div>
      <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-md">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="border border-gray-100 p-4 rounded-md">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <div className="mt-2 flex justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ul role="list" className="divide-y divide-gray-200">
            {inspections && inspections.length > 0 ? (
              inspections.map((inspection) => (
                <li key={inspection.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="bg-yellow-100 rounded-full p-2">
                          <i className="fas fa-car text-yellow-600"></i>
                        </div>
                        <div className="ml-3">
                          {inspection.vehicle.lane_number && (
                            <p className="text-xs font-bold text-primary-700">
                              Lane {inspection.vehicle.lane_number} / Run {inspection.vehicle.run_number || '?'}
                            </p>
                          )}
                          <p className="text-sm font-medium text-primary truncate">
                            {inspection.vehicle.year} {inspection.vehicle.make} {inspection.vehicle.model} {inspection.vehicle.trim}
                          </p>
                        </div>
                      </div>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(inspection.status)}`}>
                          {inspection.status.replace('_', ' ').charAt(0).toUpperCase() + inspection.status.replace('_', ' ').slice(1)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          <i className="fas fa-tag flex-shrink-0 mr-1.5 text-gray-400"></i>
                          Stock #: {inspection.vehicle.stock_number || 'N/A'}
                        </p>
                        <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                          <i className="fas fa-store flex-shrink-0 mr-1.5 text-gray-400"></i>
                          Dealer: {inspection.dealer.name}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <i className="fas fa-calendar flex-shrink-0 mr-1.5 text-gray-400"></i>
                        <p>
                          {formatDateTime(inspection.scheduled_date)}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <li className="px-4 py-6 text-center text-gray-500">
                No upcoming inspections found
              </li>
            )}
          </ul>
        )}
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <Button variant="outline" size="sm" disabled>Previous</Button>
              <Button variant="outline" size="sm" disabled>Next</Button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">1</span> to{" "}
                  <span className="font-medium">{inspections?.length || 0}</span> of{" "}
                  <span className="font-medium">{inspections?.length || 0}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <Button variant="outline" size="sm" className="rounded-l-md" disabled>
                    <span className="sr-only">Previous</span>
                    <i className="fas fa-chevron-left h-5 w-5"></i>
                  </Button>
                  <Button variant="outline" size="sm" className="relative z-10 bg-primary border-primary text-white">
                    1
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-r-md" disabled>
                    <span className="sr-only">Next</span>
                    <i className="fas fa-chevron-right h-5 w-5"></i>
                  </Button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
