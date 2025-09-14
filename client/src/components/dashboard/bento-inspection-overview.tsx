import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { 
  BentoCard, 
  BentoIcon, 
  BentoTitle 
} from "@/components/ui/bento-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface Inspection {
  id: number;
  vehicle: {
    year: number;
    make: string;
    model: string;
    stock_number?: string;
  };
  dealer: {
    name: string;
  };
  inspector?: {
    name: string;
  };
  status: "pending" | "scheduled" | "in_progress" | "completed" | "canceled";
  scheduled_date?: string;
  priority: "low" | "medium" | "high";
}

export default function BentoInspectionOverview() {
  const { data: inspections, isLoading } = useQuery<Inspection[]>({
    queryKey: ["/api/inspections/recent"],
  });

  const getStatusColor = (status: Inspection['status']) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "scheduled": return "bg-blue-100 text-blue-800 border-blue-200";
      case "in_progress": return "bg-purple-100 text-purple-800 border-purple-200";
      case "completed": return "bg-green-100 text-green-800 border-green-200";
      case "canceled": return "bg-red-100 text-red-800 border-red-200";
    }
  };

  const getPriorityIcon = (priority: Inspection['priority']) => {
    switch (priority) {
      case "high": return { icon: "fas fa-exclamation", color: "text-red-500" };
      case "medium": return { icon: "fas fa-minus", color: "text-yellow-500" };
      case "low": return { icon: "fas fa-arrow-down", color: "text-green-500" };
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not scheduled";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <BentoCard size="xl" gradient="blue">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <Skeleton className="h-5 w-32" />
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-4 rounded-lg bg-white/50">
                <div className="flex justify-between items-start mb-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-3 w-24 mb-1" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>
        </div>
      </BentoCard>
    );
  }

  return (
    <BentoCard size="xl" gradient="blue" className="overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <BentoIcon icon="fas fa-clipboard-list" gradient="blue" />
          <BentoTitle>Upcoming Inspections</BentoTitle>
        </div>
        <Link href="/inspections">
          <Button variant="outline" size="sm" className="bg-white/80 hover:bg-white">
            View All
          </Button>
        </Link>
      </div>
      
      <div className="space-y-3 overflow-y-auto max-h-80 custom-scrollbar">
        {inspections?.slice(0, 5).map((inspection, index) => {
          const priority = getPriorityIcon(inspection.priority);
          
          return (
            <motion.div
              key={inspection.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
            >
              <Link href={`/inspections/${inspection.id}`}>
                <div className="p-4 rounded-lg bg-white/60 dark:bg-gray-800/60 hover:bg-white/80 dark:hover:bg-gray-700/80 transition-colors cursor-pointer border border-white/20">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-2">
                      <i className={`${priority.icon} ${priority.color} text-sm`} />
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {inspection.vehicle.year} {inspection.vehicle.make} {inspection.vehicle.model}
                      </span>
                    </div>
                    <Badge className={getStatusColor(inspection.status)} variant="outline">
                      {inspection.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center space-x-2">
                      <i className="fas fa-building text-xs" />
                      <span>{inspection.dealer.name}</span>
                    </div>
                    
                    {inspection.inspector && (
                      <div className="flex items-center space-x-2">
                        <i className="fas fa-user text-xs" />
                        <span>{inspection.inspector.name}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2">
                      <i className="fas fa-calendar text-xs" />
                      <span>{formatDate(inspection.scheduled_date)}</span>
                    </div>
                    
                    {inspection.vehicle.stock_number && (
                      <div className="flex items-center space-x-2">
                        <i className="fas fa-tag text-xs" />
                        <span>Stock #{inspection.vehicle.stock_number}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
      
      {(!inspections || inspections.length === 0) && (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <i className="fas fa-clipboard-check text-blue-400 text-xl" />
          </div>
          <p className="text-blue-600/80 dark:text-blue-400/80 mb-4">No upcoming inspections</p>
          <Link href="/inspections/new">
            <Button variant="outline" className="bg-white/80 hover:bg-white">
              Schedule Inspection
            </Button>
          </Link>
        </div>
      )}
      
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </BentoCard>
  );
}