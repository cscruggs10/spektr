import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  BentoCard, 
  BentoIcon, 
  BentoTitle 
} from "@/components/ui/bento-grid";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface Activity {
  id: string;
  type: "inspection_completed" | "inspection_started" | "vehicle_added" | "dealer_registered";
  message: string;
  timestamp: string;
  user?: string;
  metadata?: {
    vehicle?: string;
    dealer?: string;
    inspector?: string;
  };
}

export default function BentoRecentActivity() {
  const { data: activities, isLoading } = useQuery<Activity[]>({
    queryKey: ["/api/dashboard/recent-activity"],
  });

  // Mock data for demo purposes
  const mockActivities: Activity[] = [
    {
      id: "1",
      type: "inspection_completed",
      message: "Inspection completed for 2023 Honda Civic",
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      user: "Mike Johnson",
      metadata: { vehicle: "2023 Honda Civic", dealer: "AutoMax" }
    },
    {
      id: "2", 
      type: "inspection_started",
      message: "Started inspection on 2024 Toyota Camry",
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      user: "Sarah Chen",
      metadata: { vehicle: "2024 Toyota Camry", inspector: "Sarah Chen" }
    },
    {
      id: "3",
      type: "vehicle_added", 
      message: "New vehicle added to runlist",
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      user: "System",
      metadata: { vehicle: "2022 Ford F-150", dealer: "Premier Motors" }
    },
    {
      id: "4",
      type: "dealer_registered",
      message: "New dealer registered in the system",
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      user: "Admin",
      metadata: { dealer: "Elite Auto Group" }
    }
  ];

  const displayActivities = activities || mockActivities;

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case "inspection_completed":
        return { icon: "fas fa-check-circle", gradient: "green" as const };
      case "inspection_started":
        return { icon: "fas fa-play-circle", gradient: "blue" as const };
      case "vehicle_added":
        return { icon: "fas fa-car", gradient: "purple" as const };
      case "dealer_registered":
        return { icon: "fas fa-user-plus", gradient: "orange" as const };
      default:
        return { icon: "fas fa-info-circle", gradient: "gray" as const };
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  if (isLoading) {
    return (
      <BentoCard size="xl" gradient="gray">
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <div>
              <Skeleton className="h-5 w-32" />
            </div>
          </div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </BentoCard>
    );
  }

  return (
    <BentoCard size="xl" gradient="gray" className="overflow-hidden">
      <div className="flex items-center space-x-3 mb-6">
        <BentoIcon icon="fas fa-activity" gradient="purple" />
        <BentoTitle>Recent Activity</BentoTitle>
      </div>
      
      <div className="space-y-4 overflow-y-auto max-h-80 custom-scrollbar">
        {displayActivities?.slice(0, 8).map((activity, index) => {
          const { icon, gradient } = getActivityIcon(activity.type);
          
          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              className="flex items-start space-x-3 p-3 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className={`
                w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm shadow-sm
                ${gradient === 'green' ? 'bg-gradient-to-br from-green-400 to-green-600' :
                  gradient === 'blue' ? 'bg-gradient-to-br from-blue-400 to-blue-600' :
                  gradient === 'purple' ? 'bg-gradient-to-br from-purple-400 to-purple-600' :
                  gradient === 'orange' ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                  'bg-gradient-to-br from-gray-400 to-gray-600'}
              `}>
                <i className={`${icon} text-xs`} />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed">
                  {activity.message}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {getTimeAgo(activity.timestamp)}
                  </span>
                  {activity.user && (
                    <Badge variant="outline" className="text-xs px-2 py-0">
                      {activity.user}
                    </Badge>
                  )}
                </div>
                
                {activity.metadata && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {activity.metadata.vehicle && (
                      <Badge variant="secondary" className="text-xs">
                        <i className="fas fa-car mr-1 text-xs" />
                        {activity.metadata.vehicle}
                      </Badge>
                    )}
                    {activity.metadata.dealer && (
                      <Badge variant="secondary" className="text-xs">
                        <i className="fas fa-building mr-1 text-xs" />
                        {activity.metadata.dealer}
                      </Badge>
                    )}
                    {activity.metadata.inspector && (
                      <Badge variant="secondary" className="text-xs">
                        <i className="fas fa-user mr-1 text-xs" />
                        {activity.metadata.inspector}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {(!displayActivities || displayActivities.length === 0) && (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <i className="fas fa-inbox text-gray-400 text-xl" />
          </div>
          <p className="text-gray-500 dark:text-gray-400">No recent activity</p>
        </div>
      )}
      
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </BentoCard>
  );
}