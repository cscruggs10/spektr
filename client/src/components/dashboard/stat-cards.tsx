import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { DashboardStats } from "@/lib/types";

export default function StatCards() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const cardData = [
    {
      title: "Pending Inspections",
      value: stats?.pendingInspections,
      icon: "fas fa-clipboard-check",
      color: "bg-primary",
      link: "/inspections?status=pending",
    },
    {
      title: "Completed Today",
      value: stats?.completedToday,
      icon: "fas fa-check-circle",
      color: "bg-green-500",
      link: "/inspections?status=completed",
    },
    {
      title: "Today's Matches",
      value: stats?.todayMatches,
      icon: "fas fa-car",
      color: "bg-yellow-500",
      link: "/runlists",
    },
    {
      title: "Active Dealers",
      value: stats?.activeDealers,
      icon: "fas fa-user-tie",
      color: "bg-purple-500",
      link: "/dealers",
    },
  ];

  return (
    <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {cardData.map((card, index) => (
        <Card key={index} className="bg-white overflow-hidden shadow rounded-lg">
          <CardContent className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className={`flex-shrink-0 ${card.color} rounded-md p-3`}>
                <i className={`${card.icon} text-white`}></i>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dt className="text-sm font-medium text-gray-500 truncate">{card.title}</dt>
                <dd className="flex items-baseline">
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <div className="text-2xl font-semibold text-gray-900">{card.value || 0}</div>
                  )}
                </dd>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-gray-50 px-4 py-2 sm:px-6">
            <div className="text-sm">
              <Link href={card.link} className="font-medium text-primary hover:text-primary-darker">
                View all
              </Link>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
