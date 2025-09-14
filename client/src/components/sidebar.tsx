import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const [location] = useLocation();

  const mainLinks = [
    { href: "/", label: "Dashboard", icon: "fas fa-tachometer-alt" },
    { href: "/inspections", label: "Inspections", icon: "fas fa-clipboard-check" },
    { href: "/completed-inspections", label: "Completed Inspections", icon: "fas fa-check-circle" },
    { href: "/runlists", label: "Runlists", icon: "fas fa-file-alt" },
    { href: "/auctions", label: "Auctions", icon: "fas fa-gavel" },
    { href: "/inspectors", label: "Inspectors", icon: "fas fa-users" },
  ];

  const setupLinks = [
    { href: "/inspector", label: "Inspector Portal", icon: "fas fa-user-shield" },
  ];

  return (
    <div className="bg-neutral-dark w-64 flex-shrink-0 hidden md:block">
      <div className="flex items-center justify-center h-16 border-b border-gray-700">
        <h1 className="text-white font-bold text-lg">AutoInspect Pro</h1>
      </div>
      <nav className="mt-5">
        <div className="px-4 mb-3">
          <p className="text-xs uppercase tracking-wider text-gray-400">Main</p>
        </div>
        {mainLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <div className={cn(
              "flex items-center px-6 py-2.5 cursor-pointer",
              location === link.href
                ? "bg-primary text-white"
                : "text-gray-300 hover:bg-gray-700"
            )}>
              <i className={`${link.icon} mr-3 text-sm`}></i>
              <span>{link.label}</span>
            </div>
          </Link>
        ))}

        <div className="px-4 mt-6 mb-3">
          <p className="text-xs uppercase tracking-wider text-gray-400">Setup</p>
        </div>
        {setupLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <div className={cn(
              "flex items-center px-6 py-2.5 cursor-pointer",
              location === link.href
                ? "bg-primary text-white"
                : "text-gray-300 hover:bg-gray-700"
            )}>
              <i className={`${link.icon} mr-3 text-sm`}></i>
              <span>{link.label}</span>
            </div>
          </Link>
        ))}
      </nav>
    </div>
  );
}
