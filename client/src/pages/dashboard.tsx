import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import BentoStatCards from "@/components/dashboard/bento-stat-cards";
import BentoRecentActivity from "@/components/dashboard/bento-recent-activity";
import { BentoGrid } from "@/components/ui/bento-grid";

export default function Dashboard() {
  return (
    <>
      <Helmet>
        <title>Spektr Dashboard | AI-Powered Inspection Management</title>
        <link 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" 
          rel="stylesheet"
        />
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900/10">
        <div className="py-12">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-12"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    Dashboard
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
                    AI-powered vehicle inspection management
                  </p>
                </div>
                
                <motion.div 
                  className="hidden md:flex items-center space-x-4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>System Active</span>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date().toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Bento Grid Layout */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              {/* Stats Grid */}
              <BentoStatCards />

              {/* Main Content Grid */}
              <BentoGrid>
                <BentoRecentActivity />
              </BentoGrid>
            </motion.div>
          </div>
        </div>
        
        {/* Background Elements */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-600/20 blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-br from-green-400/20 to-blue-600/20 blur-3xl"></div>
        </div>
      </div>
    </>
  );
}
