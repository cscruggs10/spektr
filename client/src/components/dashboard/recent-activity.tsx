import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ActivityLog } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";

export default function RecentActivity() {
  const { data: activities, isLoading } = useQuery<ActivityLog[]>({
    queryKey: ["/api/dashboard/activity"],
  });

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <Card className="bg-white shadow rounded-lg overflow-hidden h-full">
      <CardHeader className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <CardTitle className="text-lg font-medium text-gray-900">Recent Activity</CardTitle>
        <a href="#" className="text-sm font-medium text-primary hover:text-primary-darker">View all</a>
      </CardHeader>
      <CardContent className="p-0 bg-gray-50">
        <ul className="divide-y divide-gray-200 max-h-80 overflow-y-auto">
          {isLoading ? (
            [...Array(5)].map((_, i) => (
              <li key={i} className="px-6 py-4">
                <div className="flex items-center">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="ml-3 flex-1">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-3 w-16" />
                </div>
              </li>
            ))
          ) : activities && activities.length > 0 ? (
            activities.map((activity) => (
              <li key={activity.id} className="px-6 py-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-xs text-white">{getUserInitials(activity.user.name)}</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{activity.user.name}</p>
                    <p className="text-sm text-gray-500">{activity.action}</p>
                  </div>
                  <div className="ml-auto">
                    <p className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </li>
            ))
          ) : (
            <li className="px-6 py-6 text-center text-gray-500">
              No recent activity found
            </li>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
