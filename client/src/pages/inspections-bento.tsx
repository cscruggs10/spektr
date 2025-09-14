import { useState } from "react";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { 
  BentoGrid, 
  BentoCard, 
  BentoIcon, 
  BentoTitle, 
  BentoValue,
  BentoDescription 
} from "@/components/ui/bento-grid";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Inspection, Dealer, Inspector } from "@/lib/types";
import { formatDistanceToNow, format } from "date-fns";
import ManualInspectionModal from "@/components/modals/manual-inspection-modal";
import ManualInspectionBatchUploadModal from "@/components/modals/manual-inspection-batch-upload-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

export default function InspectionsBento() {
  const [location, setLocation] = useLocation();
  const urlParams = new URLSearchParams(location.split("?")[1] || "");
  
  const [selectedDealerId, setSelectedDealerId] = useState<string>("all");
  const [selectedInspectorId, setSelectedInspectorId] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>(urlParams.get("status") || "all");
  const [isManualInspectionModalOpen, setIsManualInspectionModalOpen] = useState(false);
  const [isBatchUploadModalOpen, setIsBatchUploadModalOpen] = useState(false);

  const { data: inspections, isLoading: isInspectionsLoading } = useQuery<Inspection[]>({
    queryKey: ["/api/inspections", selectedDealerId, selectedInspectorId, selectedStatus],
  });

  const { data: dealers } = useQuery<Dealer[]>({
    queryKey: ["/api/dealers"],
  });

  const { data: inspectors } = useQuery<Inspector[]>({
    queryKey: ["/api/inspectors"],
  });

  // Calculate stats
  const stats = {
    total: inspections?.length || 0,
    pending: inspections?.filter(i => i.status === "pending").length || 0,
    inProgress: inspections?.filter(i => i.status === "in_progress").length || 0,
    completed: inspections?.filter(i => i.status === "completed").length || 0,
    scheduled: inspections?.filter(i => i.status === "scheduled").length || 0,
    canceled: inspections?.filter(i => i.status === "canceled").length || 0,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "scheduled": return "bg-blue-100 text-blue-800 border-blue-200";
      case "in_progress": return "bg-purple-100 text-purple-800 border-purple-200";
      case "completed": return "bg-green-100 text-green-800 border-green-200";
      case "canceled": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityIcon = (priority?: string) => {
    switch (priority) {
      case "high": return { icon: "fas fa-exclamation-circle", color: "text-red-500" };
      case "medium": return { icon: "fas fa-minus-circle", color: "text-yellow-500" };
      case "low": return { icon: "fas fa-arrow-down-circle", color: "text-green-500" };
      default: return { icon: "fas fa-circle", color: "text-gray-400" };
    }
  };

  return (
    <>
      <Helmet>
        <title>Inspections | Spektr</title>
      </Helmet>
      
      <PageWrapper 
        title="Inspections"
        subtitle="Manage and track vehicle inspections"
        rightContent={
          <div className="flex items-center space-x-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg">
                  <i className="fas fa-plus mr-2" />
                  New Inspection
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => setIsManualInspectionModalOpen(true)}>
                  <i className="fas fa-edit mr-2" />
                  Manual Entry
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsBatchUploadModalOpen(true)}>
                  <i className="fas fa-file-upload mr-2" />
                  Batch Upload
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      >
        {/* Stats Grid */}
        <BentoGrid className="mb-8">
          <BentoCard size="sm" gradient="blue">
            <BentoIcon icon="fas fa-clipboard-list" gradient="blue" />
            <BentoTitle className="text-sm mt-3">Total</BentoTitle>
            <BentoValue className="text-2xl">{stats.total}</BentoValue>
          </BentoCard>
          
          <BentoCard size="sm" gradient="orange">
            <BentoIcon icon="fas fa-clock" gradient="orange" />
            <BentoTitle className="text-sm mt-3">Pending</BentoTitle>
            <BentoValue className="text-2xl">{stats.pending}</BentoValue>
          </BentoCard>
          
          <BentoCard size="sm" gradient="purple">
            <BentoIcon icon="fas fa-spinner" gradient="purple" />
            <BentoTitle className="text-sm mt-3">In Progress</BentoTitle>
            <BentoValue className="text-2xl">{stats.inProgress}</BentoValue>
          </BentoCard>
          
          <BentoCard size="sm" gradient="green">
            <BentoIcon icon="fas fa-check-circle" gradient="green" />
            <BentoTitle className="text-sm mt-3">Completed</BentoTitle>
            <BentoValue className="text-2xl">{stats.completed}</BentoValue>
          </BentoCard>
          
          <BentoCard size="sm" gradient="blue">
            <BentoIcon icon="fas fa-calendar" gradient="blue" />
            <BentoTitle className="text-sm mt-3">Scheduled</BentoTitle>
            <BentoValue className="text-2xl">{stats.scheduled}</BentoValue>
          </BentoCard>
          
          <BentoCard size="sm" gradient="red">
            <BentoIcon icon="fas fa-times-circle" gradient="red" />
            <BentoTitle className="text-sm mt-3">Canceled</BentoTitle>
            <BentoValue className="text-2xl">{stats.canceled}</BentoValue>
          </BentoCard>
        </BentoGrid>

        {/* Filters */}
        <BentoCard size="xl" gradient="gray" className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <BentoTitle>Filter Inspections</BentoTitle>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="bg-white/80 backdrop-blur-sm">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="canceled">Canceled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedDealerId} onValueChange={setSelectedDealerId}>
              <SelectTrigger className="bg-white/80 backdrop-blur-sm">
                <SelectValue placeholder="Filter by dealer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dealers</SelectItem>
                {dealers?.map(dealer => (
                  <SelectItem key={dealer.id} value={dealer.id.toString()}>
                    {dealer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedInspectorId} onValueChange={setSelectedInspectorId}>
              <SelectTrigger className="bg-white/80 backdrop-blur-sm">
                <SelectValue placeholder="Filter by inspector" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Inspectors</SelectItem>
                {inspectors?.map(inspector => (
                  <SelectItem key={inspector.id} value={inspector.id.toString()}>
                    {inspector.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </BentoCard>

        {/* Inspections List */}
        <BentoCard size="xl" gradient="blue">
          <div className="flex items-center justify-between mb-6">
            <BentoTitle>Inspection List</BentoTitle>
            <Badge variant="outline" className="bg-white/80">
              {inspections?.length || 0} inspections
            </Badge>
          </div>

          {isInspectionsLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
              {inspections?.map((inspection, index) => {
                const priority = getPriorityIcon(inspection.priority);
                
                return (
                  <motion.div
                    key={inspection.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    onClick={() => setLocation(`/inspection-detail/${inspection.id}`)}
                    className="p-4 rounded-lg bg-white/60 dark:bg-gray-800/60 hover:bg-white/80 dark:hover:bg-gray-700/80 transition-all cursor-pointer border border-white/20 hover:shadow-lg group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <i className={`${priority.icon} ${priority.color}`} />
                          <span className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                            {inspection.vehicle?.year} {inspection.vehicle?.make} {inspection.vehicle?.model}
                          </span>
                          <Badge className={getStatusColor(inspection.status)} variant="outline">
                            {inspection.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center space-x-2">
                            <i className="fas fa-building text-xs" />
                            <span>{inspection.dealer?.name || "No dealer"}</span>
                          </div>
                          
                          {inspection.inspector && (
                            <div className="flex items-center space-x-2">
                              <i className="fas fa-user text-xs" />
                              <span>{inspection.inspector.name}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-2">
                            <i className="fas fa-calendar text-xs" />
                            <span>
                              {inspection.scheduled_date 
                                ? format(new Date(inspection.scheduled_date), "MMM d, h:mm a")
                                : "Not scheduled"}
                            </span>
                          </div>
                          
                          {inspection.vehicle?.stock_number && (
                            <div className="flex items-center space-x-2">
                              <i className="fas fa-tag text-xs" />
                              <span>Stock #{inspection.vehicle.stock_number}</span>
                            </div>
                          )}
                          
                          {inspection.vehicle?.vin && (
                            <div className="flex items-center space-x-2">
                              <i className="fas fa-fingerprint text-xs" />
                              <span className="font-mono text-xs">{inspection.vehicle.vin}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <i className="fas fa-arrow-right" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
              
              {(!inspections || inspections.length === 0) && (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <i className="fas fa-clipboard-list text-blue-400 text-2xl" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">No inspections found</p>
                  <Button 
                    onClick={() => setIsManualInspectionModalOpen(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600"
                  >
                    Create First Inspection
                  </Button>
                </div>
              )}
            </div>
          )}
        </BentoCard>

        {/* Modals */}
        <ManualInspectionModal 
          open={isManualInspectionModalOpen} 
          onOpenChange={setIsManualInspectionModalOpen} 
        />
        <ManualInspectionBatchUploadModal 
          open={isBatchUploadModalOpen} 
          onOpenChange={setIsBatchUploadModalOpen} 
        />
      </PageWrapper>
    </>
  );
}