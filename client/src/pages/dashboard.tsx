import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import { Link } from "wouter";
import BentoStatCards from "@/components/dashboard/bento-stat-cards";
import BentoRecentActivity from "@/components/dashboard/bento-recent-activity";
import { BentoGrid } from "@/components/ui/bento-grid";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const currentHour = new Date().getHours();
  const getGreeting = () => {
    if (currentHour < 12) return "Good morning";
    if (currentHour < 17) return "Good afternoon";
    return "Good evening";
  };

  const quickActions = [
    {
      title: "Start New Inspection",
      description: "Begin a new vehicle inspection",
      icon: "fas fa-plus-circle",
      href: "/inspections",
      gradient: "from-blue-500 to-blue-600",
      color: "blue"
    },
    {
      title: "View Active Inspections",
      description: "Check ongoing inspections",
      icon: "fas fa-clipboard-check",
      href: "/inspections",
      gradient: "from-green-500 to-green-600",
      color: "green"
    },
    {
      title: "Manage Auctions",
      description: "Set up auction locations",
      icon: "fas fa-gavel",
      href: "/auctions",
      gradient: "from-yellow-500 to-orange-600",
      color: "orange"
    },
    {
      title: "Inspector Portal",
      description: "Access mobile inspection tools",
      icon: "fas fa-user-shield",
      href: "/inspector",
      gradient: "from-purple-500 to-purple-600",
      color: "purple"
    }
  ];

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
        <div className="py-8">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">

            {/* Welcome Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="mb-6 lg:mb-0">
                  <motion.h1
                    className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1, duration: 0.6 }}
                  >
                    {getGreeting()}!
                  </motion.h1>
                  <motion.p
                    className="text-xl text-gray-600 dark:text-gray-300 mb-1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                  >
                    Welcome to your Spektr dashboard
                  </motion.p>
                  <motion.p
                    className="text-gray-500 dark:text-gray-400"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                  >
                    AI-powered vehicle inspection management at your fingertips
                  </motion.p>
                </div>

                <motion.div
                  className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
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

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="mb-12"
            >
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickActions.map((action, index) => (
                  <motion.div
                    key={action.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1, duration: 0.4 }}
                  >
                    <Link href={action.href}>
                      <div className="group relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 cursor-pointer">
                        <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                        <div className="relative z-10">
                          <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                            <i className={`${action.icon} text-white text-lg`}></i>
                          </div>
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300">
                            {action.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {action.description}
                          </p>
                          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <i className="fas fa-arrow-right text-gray-400 text-sm"></i>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Dashboard Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="mb-12"
            >
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Overview</h2>
              <BentoStatCards />
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Recent Activity</h2>
              <BentoGrid>
                <BentoRecentActivity />
              </BentoGrid>
            </motion.div>
          </div>
        </div>

        {/* Enhanced Background Elements */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-gradient-to-br from-blue-400/15 to-purple-600/15 blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-gradient-to-br from-green-400/15 to-blue-600/15 blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-purple-400/5 to-blue-600/5 blur-3xl"></div>
        </div>
      </div>
    </>
  );
}
