import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useMobile } from "@/hooks/use-mobile";

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const isMobile = useMobile();
  const [location] = useLocation();

  return (
    <header className="bg-white border-b border-gray-200 flex items-center justify-between px-4 h-16">
      {isMobile && (
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <i className="fas fa-bars"></i>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 bg-neutral-dark text-gray-100">
            <div className="flex items-center justify-center h-16 border-b border-gray-700">
              <h1 className="text-white font-bold text-lg">AutoInspect Pro</h1>
            </div>
            <nav className="mt-5">
              {/* Operations Section */}
              <div className="px-4 mb-3">
                <p className="text-xs uppercase tracking-wider text-gray-400">Operations</p>
              </div>
              <Link href="/" className={`flex items-center px-6 py-2.5 ${location === "/" ? "bg-primary text-white" : "text-gray-300 hover:bg-gray-700"}`}>
                <i className="fas fa-tachometer-alt mr-3 text-sm"></i>
                <span>Dashboard</span>
              </Link>
              <Link href="/runlists" className={`flex items-center px-6 py-2.5 ${location === "/runlists" ? "bg-primary text-white" : "text-gray-300 hover:bg-gray-700"}`}>
                <i className="fas fa-file-alt mr-3 text-sm"></i>
                <span>Runlists</span>
              </Link>
              <Link href="/buy-box" className={`flex items-center px-6 py-2.5 ${location === "/buy-box" ? "bg-primary text-white" : "text-gray-300 hover:bg-gray-700"}`}>
                <i className="fas fa-car mr-3 text-sm"></i>
                <span>Buy Box</span>
              </Link>
              <Link href="/inspections" className={`flex items-center px-6 py-2.5 ${location === "/inspections" ? "bg-primary text-white" : "text-gray-300 hover:bg-gray-700"}`}>
                <i className="fas fa-clipboard-check mr-3 text-sm"></i>
                <span>Inspections</span>
              </Link>
              <Link href="/inspection-results" className={`flex items-center px-6 py-2.5 ${location === "/inspection-results" ? "bg-primary text-white" : "text-gray-300 hover:bg-gray-700"}`}>
                <i className="fas fa-search mr-3 text-sm"></i>
                <span>Completed Inspections</span>
              </Link>
              <Link href="/inspector" className={`flex items-center px-6 py-2.5 ${location === "/inspector" ? "bg-primary text-white" : "text-gray-300 hover:bg-gray-700"}`}>
                <i className="fas fa-user-shield mr-3 text-sm"></i>
                <span>Inspector Portal</span>
              </Link>

              {/* Management Section */}
              <div className="px-4 mt-6 mb-3">
                <p className="text-xs uppercase tracking-wider text-gray-400">Management</p>
              </div>
              <Link href="/dealers" className={`flex items-center px-6 py-2.5 ${location === "/dealers" ? "bg-primary text-white" : "text-gray-300 hover:bg-gray-700"}`}>
                <i className="fas fa-handshake mr-3 text-sm"></i>
                <span>Client Partners</span>
              </Link>
              <Link href="/inspectors" className={`flex items-center px-6 py-2.5 ${location === "/inspectors" ? "bg-primary text-white" : "text-gray-300 hover:bg-gray-700"}`}>
                <i className="fas fa-users mr-3 text-sm"></i>
                <span>Inspectors</span>
              </Link>
              <Link href="/auctions" className={`flex items-center px-6 py-2.5 ${location === "/auctions" ? "bg-primary text-white" : "text-gray-300 hover:bg-gray-700"}`}>
                <i className="fas fa-gavel mr-3 text-sm"></i>
                <span>Auctions</span>
              </Link>
              <Link href="/inspection-templates" className={`flex items-center px-6 py-2.5 ${location === "/inspection-templates" ? "bg-primary text-white" : "text-gray-300 hover:bg-gray-700"}`}>
                <i className="fas fa-list-check mr-3 text-sm"></i>
                <span>Templates</span>
              </Link>

              {/* Tools & Settings */}
              <div className="px-4 mt-6 mb-3">
                <p className="text-xs uppercase tracking-wider text-gray-400">Tools & Settings</p>
              </div>
              <Link href="/vehicle-tools" className={`flex items-center px-6 py-2.5 ${location === "/vehicle-tools" ? "bg-primary text-white" : "text-gray-300 hover:bg-gray-700"}`}>
                <i className="fas fa-tools mr-3 text-sm"></i>
                <span>Vehicle Tools</span>
              </Link>
              <Link href="/settings" className={`flex items-center px-6 py-2.5 ${location === "/settings" ? "bg-primary text-white" : "text-gray-300 hover:bg-gray-700"}`}>
                <i className="fas fa-cog mr-3 text-sm"></i>
                <span>Settings</span>
              </Link>
              <Link href="/help" className={`flex items-center px-6 py-2.5 ${location === "/help" ? "bg-primary text-white" : "text-gray-300 hover:bg-gray-700"}`}>
                <i className="fas fa-question-circle mr-3 text-sm"></i>
                <span>Help</span>
              </Link>
            </nav>
          </SheetContent>
        </Sheet>
      )}

      <div className="flex-1 flex justify-between items-center md:justify-end">
        <div className="relative w-64 md:w-96">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center">
            <i className="fas fa-search text-gray-400"></i>
          </span>
          <Input 
            type="text" 
            className="pl-10 w-full"
            placeholder="Search..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center">
          <Button variant="ghost" className="mx-4 relative" size="icon">
            <i className="fas fa-bell"></i>
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
          </Button>
          <div className="border-l pl-3 border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
                <span className="text-xs">JD</span>
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700 hidden md:block">John Doe</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
