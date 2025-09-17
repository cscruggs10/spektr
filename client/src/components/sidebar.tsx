import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function Sidebar() {
  const [location] = useLocation();

  const mainLinks = [
    { href: "/", label: "Dashboard", icon: "fas fa-th-large", gradient: "from-blue-500 to-purple-600" },
    { href: "/inspections", label: "Inspections", icon: "fas fa-clipboard-check", gradient: "from-green-500 to-teal-600" },
    { href: "/dealers", label: "Dealers", icon: "fas fa-building", gradient: "from-orange-500 to-red-600" },
    { href: "/runlists", label: "Runlists", icon: "fas fa-file-alt", gradient: "from-purple-500 to-pink-600" },
    { href: "/auctions", label: "Auctions", icon: "fas fa-gavel", gradient: "from-yellow-500 to-orange-600" },
    { href: "/inspectors", label: "Inspectors", icon: "fas fa-users", gradient: "from-cyan-500 to-blue-600" },
  ];

  const setupLinks = [
    { href: "/inspector", label: "Inspector Portal", icon: "fas fa-user-shield", gradient: "from-indigo-500 to-purple-600" },
    { href: "/completed-inspections", label: "Completed", icon: "fas fa-check-circle", gradient: "from-green-600 to-emerald-600" },
  ];

  return (
    <div className="w-64 flex-shrink-0 hidden md:block bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 border-r border-gray-700/50">
      <div className="flex items-center justify-center h-20 border-b border-gray-700/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 flex items-center space-x-3"
        >
          <div className="flex items-center justify-center">
            <img src="/spektr-logo.svg" alt="Spektr" className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-white font-bold text-xl tracking-tight">SPEKTR</h1>
        </motion.div>
      </div>
      <nav className="mt-6 px-3">
        <div className="px-3 mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Navigation</p>
        </div>
        {mainLinks.map((link, index) => {
          const isActive = location === link.href;
          return (
            <motion.div
              key={link.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={link.href}>
                <div className={cn(
                  "group flex items-center px-3 py-2.5 mb-1 rounded-xl cursor-pointer transition-all duration-200",
                  isActive
                    ? "bg-gradient-to-r " + link.gradient + " text-white shadow-lg shadow-blue-500/25"
                    : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                )}>
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center mr-3 transition-all",
                    isActive 
                      ? "bg-white/20" 
                      : "bg-gray-700/50 group-hover:bg-gradient-to-r group-hover:" + link.gradient
                  )}>
                    <i className={`${link.icon} text-sm ${!isActive && "group-hover:text-white"}`}></i>
                  </div>
                  <span className="font-medium text-sm">{link.label}</span>
                  {isActive && (
                    <motion.div 
                      className="ml-auto w-1.5 h-1.5 bg-white rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    />
                  )}
                </div>
              </Link>
            </motion.div>
          );
        })}

        <div className="px-3 mt-8 mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Tools</p>
        </div>
        {setupLinks.map((link, index) => {
          const isActive = location === link.href;
          return (
            <motion.div
              key={link.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: (mainLinks.length + index) * 0.1 }}
            >
              <Link href={link.href}>
                <div className={cn(
                  "group flex items-center px-3 py-2.5 mb-1 rounded-xl cursor-pointer transition-all duration-200",
                  isActive
                    ? "bg-gradient-to-r " + link.gradient + " text-white shadow-lg"
                    : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                )}>
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center mr-3 transition-all",
                    isActive 
                      ? "bg-white/20" 
                      : "bg-gray-700/50 group-hover:bg-gradient-to-r group-hover:" + link.gradient
                  )}>
                    <i className={`${link.icon} text-sm ${!isActive && "group-hover:text-white"}`}></i>
                  </div>
                  <span className="font-medium text-sm">{link.label}</span>
                  {isActive && (
                    <motion.div 
                      className="ml-auto w-1.5 h-1.5 bg-white rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    />
                  )}
                </div>
              </Link>
            </motion.div>
          );
        })}
      </nav>
      
      {/* Bottom section with user info */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700/50">
        <div className="flex items-center space-x-3 p-3 rounded-xl bg-gray-800/50">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center">
            <i className="fas fa-user text-white text-sm"></i>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">Admin User</p>
            <p className="text-xs text-gray-400">System Administrator</p>
          </div>
          <button className="text-gray-400 hover:text-white transition-colors">
            <i className="fas fa-cog text-sm"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
