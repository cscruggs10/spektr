import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { motion } from "framer-motion";

interface BentoGridProps {
  children: ReactNode;
  className?: string;
}

interface BentoCardProps {
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  orientation?: "square" | "wide" | "tall";
  hover?: boolean;
  gradient?: "blue" | "purple" | "green" | "orange" | "red" | "gray";
}

const BentoGrid = ({ children, className }: BentoGridProps) => {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6 auto-rows-[200px]",
        className
      )}
    >
      {children}
    </div>
  );
};

const BentoCard = ({
  children,
  className,
  size = "md",
  orientation = "square",
  hover = true,
  gradient = "gray"
}: BentoCardProps) => {
  const sizeClasses = {
    sm: "col-span-1 row-span-1",
    md: "col-span-1 md:col-span-2 row-span-1",
    lg: "col-span-1 md:col-span-2 lg:col-span-3 row-span-2",
    xl: "col-span-1 md:col-span-2 lg:col-span-4 xl:col-span-6 row-span-2"
  };

  const orientationClasses = {
    square: "row-span-1",
    wide: "col-span-2 row-span-1",
    tall: "row-span-2"
  };

  const gradientClasses = {
    blue: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/30 border-blue-200 dark:border-blue-800/30",
    purple: "bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/30 border-purple-200 dark:border-purple-800/30",
    green: "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/30 border-green-200 dark:border-green-800/30",
    orange: "bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/30 border-orange-200 dark:border-orange-800/30",
    red: "bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/30 border-red-200 dark:border-red-800/30",
    gray: "bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/30 border-gray-200 dark:border-gray-800/30"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      whileHover={hover ? { 
        scale: 1.02, 
        y: -4,
        boxShadow: "0 20px 40px -12px rgba(0, 0, 0, 0.15)"
      } : {}}
      className={cn(
        "rounded-xl border backdrop-blur-sm transition-all duration-300 ease-out",
        "hover:border-opacity-80 cursor-pointer group relative overflow-hidden",
        sizeClasses[size],
        orientationClasses[orientation],
        gradientClasses[gradient],
        className
      )}
    >
      {/* Subtle gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
      
      {/* Content */}
      <div className="relative h-full p-4 md:p-6 flex flex-col justify-between">
        {children}
      </div>
    </motion.div>
  );
};

const BentoIcon = ({ 
  icon, 
  className, 
  gradient = "blue" 
}: { 
  icon: string; 
  className?: string;
  gradient?: "blue" | "purple" | "green" | "orange" | "red" | "gray";
}) => {
  const gradientClasses = {
    blue: "bg-gradient-to-br from-blue-400 to-blue-600",
    purple: "bg-gradient-to-br from-purple-400 to-purple-600",
    green: "bg-gradient-to-br from-green-400 to-green-600",
    orange: "bg-gradient-to-br from-orange-400 to-orange-600",
    red: "bg-gradient-to-br from-red-400 to-red-600",
    gray: "bg-gradient-to-br from-gray-400 to-gray-600"
  };

  return (
    <div className={cn(
      "w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg",
      gradientClasses[gradient],
      className
    )}>
      <i className={`${icon} text-xl`} />
    </div>
  );
};

const BentoTitle = ({ children, className }: { children: ReactNode; className?: string }) => {
  return (
    <h3 className={cn(
      "text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2",
      className
    )}>
      {children}
    </h3>
  );
};

const BentoDescription = ({ children, className }: { children: ReactNode; className?: string }) => {
  return (
    <p className={cn(
      "text-sm text-gray-600 dark:text-gray-400 line-clamp-2",
      className
    )}>
      {children}
    </p>
  );
};

const BentoValue = ({ 
  children, 
  className,
  trend,
  trendValue
}: { 
  children: ReactNode; 
  className?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
}) => {
  const trendColors = {
    up: "text-green-600 dark:text-green-400",
    down: "text-red-600 dark:text-red-400", 
    neutral: "text-gray-600 dark:text-gray-400"
  };

  const trendIcons = {
    up: "fas fa-arrow-trend-up",
    down: "fas fa-arrow-trend-down",
    neutral: "fas fa-minus"
  };

  return (
    <div className="flex items-end justify-between">
      <span className={cn(
        "text-3xl font-bold text-gray-900 dark:text-gray-100",
        className
      )}>
        {children}
      </span>
      {trend && trendValue && (
        <div className={cn("flex items-center text-sm font-medium", trendColors[trend])}>
          <i className={cn(trendIcons[trend], "mr-1 text-xs")} />
          {trendValue}
        </div>
      )}
    </div>
  );
};

export { BentoGrid, BentoCard, BentoIcon, BentoTitle, BentoDescription, BentoValue };