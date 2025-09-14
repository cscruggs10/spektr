import { Helmet } from "react-helmet";
import StatCards from "@/components/dashboard/stat-cards";
import InspectionTable from "@/components/dashboard/inspection-table";
import RecentActivity from "@/components/dashboard/recent-activity";
import DealerCards from "@/components/dashboard/dealer-cards";

export default function Dashboard() {
  return (
    <>
      <Helmet>
        <title>Dashboard | AutoInspect Pro</title>
        <link 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" 
          rel="stylesheet"
        />
      </Helmet>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          {/* Quick Stats Section */}
          <StatCards />

          {/* Upcoming Inspections Section */}
          <InspectionTable />

          {/* Recent Activity Section - Full width now */}
          <div className="mt-8">
            <RecentActivity />
          </div>

          {/* Dealer Section */}
          <DealerCards />
        </div>
      </div>
    </>
  );
}
