import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { DashboardStats } from "@/lib/types";
import { 
  BentoGrid, 
  BentoCard, 
  BentoIcon, 
  BentoTitle, 
  BentoValue,
  BentoDescription 
} from "@/components/ui/bento-grid";
import { Skeleton } from "@/components/ui/skeleton";

export default function BentoStatCards() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <BentoGrid className="mb-8">
        {[...Array(6)].map((_, i) => (
          <BentoCard key={i} size="sm">
            <div className="space-y-4">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          </BentoCard>
        ))}
      </BentoGrid>
    );
  }

  const statCards = [
    {
      title: "Pending Inspections",
      value: stats?.pendingInspections || 0,
      icon: "fas fa-clock",
      gradient: "orange" as const,
      size: "md" as const,
      description: "Awaiting inspector assignment",
      link: "/inspections?status=pending",
      trend: "up" as const,
      trendValue: "+12%"
    },
    {
      title: "Completed Today", 
      value: stats?.completedToday || 0,
      icon: "fas fa-check-circle",
      gradient: "green" as const,
      size: "sm" as const,
      description: "Successfully completed",
      link: "/inspections?status=completed",
      trend: "up" as const,
      trendValue: "+8%"
    },
    {
      title: "Active Inspectors",
      value: stats?.activeInspectors || 0,
      icon: "fas fa-user-hard-hat",
      gradient: "blue" as const,
      size: "sm" as const,
      description: "Currently working",
      link: "/inspectors",
      trend: "neutral" as const,
      trendValue: "0%"
    },
    {
      title: "Today's Matches",
      value: stats?.todayMatches || 0,
      icon: "fas fa-bullseye",
      gradient: "purple" as const,
      size: "lg" as const,
      orientation: "tall" as const,
      description: "Vehicles matched to dealer preferences using AI-powered analysis",
      link: "/buy-box",
      trend: "up" as const,
      trendValue: "+24%"
    },
    {
      title: "Revenue This Month",
      value: `$${((stats?.monthlyRevenue || 0) / 1000).toFixed(1)}k`,
      icon: "fas fa-dollar-sign",
      gradient: "green" as const,
      size: "md" as const,
      description: "Total inspection fees collected",
      link: "/dashboard",
      trend: "up" as const,
      trendValue: "+15%"
    },
    {
      title: "Avg. Completion Time",
      value: `${stats?.avgCompletionTime || 0}h`,
      icon: "fas fa-stopwatch",
      gradient: "gray" as const,
      size: "sm" as const,
      description: "Per inspection",
      link: "/dashboard",
      trend: "down" as const,
      trendValue: "-5%"
    }
  ];

  return (
    <BentoGrid className="mb-8">
      {statCards.map((card, index) => (
        <Link key={index} href={card.link}>
          <BentoCard
            size={card.size}
            orientation={card.orientation}
            gradient={card.gradient}
            className="cursor-pointer"
          >
            <div className="flex items-start justify-between mb-auto">
              <div className="space-y-2">
                <BentoIcon icon={card.icon} gradient={card.gradient} />
                <BentoTitle className="text-base">{card.title}</BentoTitle>
                <BentoDescription>{card.description}</BentoDescription>
              </div>
              {card.size === "sm" && (
                <div className="text-right">
                  <BentoValue trend={card.trend} trendValue={card.trendValue}>
                    {card.value}
                  </BentoValue>
                </div>
              )}
            </div>
            
            {card.size !== "sm" && (
              <div className="mt-auto">
                <BentoValue 
                  trend={card.trend} 
                  trendValue={card.trendValue}
                  className="text-4xl"
                >
                  {card.value}
                </BentoValue>
              </div>
            )}
          </BentoCard>
        </Link>
      ))}
    </BentoGrid>
  );
}