import { useState } from "react";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
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
import { Input } from "@/components/ui/input";
import { Dealer } from "@/lib/types";
import AddDealerModal from "@/components/modals/add-dealer-modal";
import { format } from "date-fns";

export default function DealersBento() {
  const [isAddDealerModalOpen, setIsAddDealerModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: dealers, isLoading } = useQuery<Dealer[]>({
    queryKey: ["/api/dealers"],
  });

  const filteredDealers = dealers?.filter(dealer => 
    dealer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dealer.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dealer.contact_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate stats
  const stats = {
    total: dealers?.length || 0,
    active: dealers?.filter(d => d.status === "active").length || 0,
    pending: dealers?.filter(d => d.status === "pending").length || 0,
    inactive: dealers?.filter(d => d.status === "inactive").length || 0,
    totalInspections: dealers?.reduce((sum, d) => sum + (d.total_inspections || 0), 0) || 0,
    avgInspections: dealers?.length ? 
      Math.round((dealers.reduce((sum, d) => sum + (d.total_inspections || 0), 0) / dealers.length)) : 0
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800 border-green-200";
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "inactive": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <>
      <Helmet>
        <title>Dealers | Spektr</title>
      </Helmet>
      
      <PageWrapper 
        title="Dealers"
        subtitle="Manage dealer relationships and preferences"
        rightContent={
          <Button 
            onClick={() => setIsAddDealerModalOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
          >
            <i className="fas fa-plus mr-2" />
            Add Dealer
          </Button>
        }
      >
        {/* Stats Grid */}
        <BentoGrid className="mb-8">
          <BentoCard size="md" gradient="blue">
            <div className="flex items-start justify-between">
              <div>
                <BentoIcon icon="fas fa-building" gradient="blue" />
                <BentoTitle className="text-sm mt-3">Total Dealers</BentoTitle>
                <BentoValue className="text-3xl">{stats.total}</BentoValue>
              </div>
              <div className="text-right">
                <BentoDescription>All registered dealers</BentoDescription>
              </div>
            </div>
          </BentoCard>
          
          <BentoCard size="sm" gradient="green">
            <BentoIcon icon="fas fa-check-circle" gradient="green" />
            <BentoTitle className="text-sm mt-3">Active</BentoTitle>
            <BentoValue className="text-2xl">{stats.active}</BentoValue>
          </BentoCard>
          
          <BentoCard size="sm" gradient="yellow">
            <BentoIcon icon="fas fa-hourglass-half" gradient="orange" />
            <BentoTitle className="text-sm mt-3">Pending</BentoTitle>
            <BentoValue className="text-2xl">{stats.pending}</BentoValue>
          </BentoCard>
          
          <BentoCard size="md" gradient="purple">
            <div className="flex items-start justify-between">
              <div>
                <BentoIcon icon="fas fa-clipboard-check" gradient="purple" />
                <BentoTitle className="text-sm mt-3">Total Inspections</BentoTitle>
                <BentoValue className="text-3xl">{stats.totalInspections}</BentoValue>
              </div>
              <div className="text-right mt-auto">
                <BentoDescription>Avg {stats.avgInspections} per dealer</BentoDescription>
              </div>
            </div>
          </BentoCard>
        </BentoGrid>

        {/* Search Bar */}
        <BentoCard size="xl" gradient="gray" className="mb-8">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search dealers by name, contact, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/80 backdrop-blur-sm border-gray-200 focus:border-blue-400"
              />
            </div>
            <Badge variant="outline" className="bg-white/80">
              {filteredDealers?.length || 0} results
            </Badge>
          </div>
        </BentoCard>

        {/* Dealers Grid */}
        <BentoGrid>
          {isLoading ? (
            [...Array(6)].map((_, i) => (
              <BentoCard key={i} size="md" gradient="gray">
                <div className="space-y-3">
                  <Skeleton className="h-12 w-12 rounded-xl" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </BentoCard>
            ))
          ) : (
            filteredDealers?.map((dealer, index) => (
              <motion.div
                key={dealer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
              >
                <BentoCard 
                  size="md" 
                  gradient={dealer.status === "active" ? "green" : dealer.status === "pending" ? "orange" : "gray"}
                  className="cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <BentoIcon 
                      icon="fas fa-building" 
                      gradient={dealer.status === "active" ? "green" : dealer.status === "pending" ? "orange" : "gray"}
                    />
                    <Badge className={getStatusColor(dealer.status)} variant="outline">
                      {dealer.status}
                    </Badge>
                  </div>
                  
                  <BentoTitle className="text-lg mb-3 group-hover:text-blue-600 transition-colors">
                    {dealer.name}
                  </BentoTitle>
                  
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center space-x-2">
                      <i className="fas fa-user text-xs" />
                      <span>{dealer.contact_name || "No contact"}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <i className="fas fa-envelope text-xs" />
                      <span className="truncate">{dealer.contact_email || "No email"}</span>
                    </div>
                    
                    {dealer.contact_phone && (
                      <div className="flex items-center space-x-2">
                        <i className="fas fa-phone text-xs" />
                        <span>{dealer.contact_phone}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2">
                      <i className="fas fa-calendar text-xs" />
                      <span>Joined {format(new Date(dealer.joined_date), "MMM yyyy")}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-1">
                          <i className="fas fa-clipboard-check text-xs text-blue-500" />
                          <span className="font-medium">{dealer.total_inspections || 0}</span>
                          <span className="text-gray-500">inspections</span>
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
                  </div>
                </BentoCard>
              </motion.div>
            ))
          )}
          
          {(!filteredDealers || filteredDealers.length === 0) && !isLoading && (
            <BentoCard size="xl" gradient="gray" className="col-span-full">
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <i className="fas fa-building text-gray-400 text-2xl" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {searchTerm ? "No dealers found matching your search" : "No dealers registered yet"}
                </p>
                <Button 
                  onClick={() => setIsAddDealerModalOpen(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600"
                >
                  Add First Dealer
                </Button>
              </div>
            </BentoCard>
          )}
        </BentoGrid>

        {/* Add Dealer Modal */}
        <AddDealerModal 
          open={isAddDealerModalOpen} 
          onOpenChange={setIsAddDealerModalOpen} 
        />
      </PageWrapper>
    </>
  );
}