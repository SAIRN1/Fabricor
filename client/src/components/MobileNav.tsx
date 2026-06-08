import { Link, useLocation } from "wouter";
import { LayoutDashboard, AlertTriangle, Users, Briefcase, Calendar, Brain } from "lucide-react";

const NAV = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/issues", icon: AlertTriangle, label: "Issues" },
  { href: "/customers", icon: Users, label: "Customers" },
  { href: "/jobs", icon: Briefcase, label: "Jobs" },
  { href: "/schedule", icon: Calendar, label: "Schedule" },
  { href: "/intelligence", icon: Brain, label: "AI" },
];

export default function MobileNav() {
  const [location] = useLocation();
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0d0d14] border-t border-zinc-800 flex md:hidden">
      {NAV.map(({ href, icon: Icon, label }) => {
        const active = location === href || (href !== "/" && location.startsWith(href));
        return (
          <Link key={href} href={href}>
            <a className={`flex-1 flex flex-col items-center justify-center py-3 px-1 transition-colors ${active ? "text-amber-400" : "text-zinc-500"}`}>
              <Icon size={20} />
              <span className="text-xs mt-1 font-medium">{label}</span>
            </a>
          </Link>
        );
      })}
    </div>
  );
}
