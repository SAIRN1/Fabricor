import { Mail, Calculator, PenTool, Upload, CreditCard, Layers, BookOpen, Shield, useState, useEffect, createContext, useContext } from "react";
import { Mail, Calculator, PenTool, Upload, CreditCard, Layers, BookOpen, Shield, Route, Switch, useLocation, Link } from "wouter";
import { Mail, Calculator, PenTool, Upload, CreditCard, Layers, BookOpen, Shield, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Dashboard from "./pages/Dashboard";
import Issues from "./pages/Issues";
import Intelligence from "./pages/Intelligence";
import Customers from "./pages/Customers";
import Jobs from "./pages/Jobs";
import Schedule from "./pages/Schedule";
import Emails from "./pages/Emails";
import Estimator from "./pages/Estimator";
import Layout from "./pages/Layout";
import Onboarding from "./pages/Onboarding";
import CustomerPortal from "./pages/CustomerPortal";
import Silica from "./pages/Silica";
import Inventory from "./pages/Inventory";
import QuickBooks from "./pages/QuickBooks";
import Billing from "./pages/Billing";
import Landing from "./pages/Landing";
import Import from "./pages/Import";
import { Mail, Calculator, PenTool, Upload, CreditCard, Layers, BookOpen, Shield, Resources, Sales, PriceBook, Settings } from "./pages/OtherPages";
import Login from "./pages/Login";
import MobileNav from "./components/MobileNav";
import { Mail, Calculator, PenTool, Upload, CreditCard, Layers, BookOpen, Shield,
  LayoutDashboard, AlertTriangle, Users, TrendingUp,
  BookOpen, Brain, Settings as SettingsIcon, LogOut,
  ChevronRight, Activity, Zap, Briefcase, Calendar
} from "lucide-react";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } }
});

interface AuthUser {
  id: string; email: string; name: string;
  role: string; plan: string; shopName?: string;
}
interface AuthContextType {
  user: AuthUser | null;
  setUser: (u: AuthUser | null) => void;
  loading: boolean;
}
export const AuthContext = createContext<AuthContextType>({ user: null, setUser: () => {}, loading: true });
export const useAuth = () => useContext(AuthContext);

function AppContent() {
  const { user, loading, setUser } = useAuth();
  const [location] = useLocation();

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-zinc-500 font-mono text-sm">Loading StoneDesk...</p>
      </div>
    </div>
  );

  if (user && !user.shopName) return <Onboarding onComplete={() => window.location.reload()} />;
  if (!user) {
    const path = window.location.pathname;
    if (path === "/login" || path.startsWith("/login")) return <Login />;
    return <Landing />;
  }

  const nav = [
    { href: "/", icon: LayoutDashboard, label: "Dashboard", desc: "Shop overview" },
    { href: "/issues", icon: AlertTriangle, label: "Issues", desc: "Quality tracker" },
    { href: "/customers", icon: Users, label: "Customers", desc: "Customer database" },
    { href: "/jobs", icon: Briefcase, label: "Jobs", desc: "Job pipeline" },
    { href: "/schedule", icon: Calendar, label: "Schedule", desc: "Route & scheduling" },
    { href: "/emails", icon: Mail, label: "Emails", desc: "AI email generator" },
    { href: "/estimator", icon: Calculator, label: "Estimator", desc: "Price calculator" },
    { href: "/layout", icon: PenTool, label: "Layout", desc: "2D drawing tool" },
    { href: "/import", icon: Upload, label: "Import", desc: "Excel & CSV import" },
    { href: "/billing", icon: CreditCard, label: "Billing", desc: "Plans & subscription" },
    { href: "/inventory", icon: Layers, label: "Inventory", desc: "Slab inventory" },
    { href: "/quickbooks", icon: BookOpen, label: "QuickBooks", desc: "QB export" },
    { href: "/silica", icon: Shield, label: "Silica", desc: "Safety compliance" },
    { href: "/resources", icon: Users, label: "Resources", desc: "Team productivity" },
    { href: "/sales", icon: TrendingUp, label: "Sales", desc: "Rep performance" },
    { href: "/pricebook", icon: BookOpen, label: "Price Book", desc: "Pricing & costs" },
    { href: "/intelligence", icon: Brain, label: "Intelligence", desc: "AI analysis" },
    { href: "/settings", icon: SettingsIcon, label: "Settings", desc: "Configuration" },
  ];

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    queryClient.clear();
  };

  const planColors: Record<string, string> = {
    starter: "text-zinc-400 bg-zinc-800",
    professional: "text-amber-400 bg-amber-950",
    enterprise: "text-emerald-400 bg-emerald-950",
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      <aside className="w-64 min-h-screen hidden md:flex bg-[#0d0d14] border-r border-zinc-800/60 flex flex-col fixed left-0 top-0 bottom-0 z-20">
        <div className="px-6 pt-7 pb-6 border-b border-zinc-800/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
              <Zap size={16} className="text-black" />
            </div>
            <div>
              <div className="text-white font-bold text-lg tracking-tight leading-none">STONEDESK</div>
              <div className="text-zinc-500 text-xs font-mono mt-0.5">Stone Intelligence</div>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 border-b border-zinc-800/60">
          <div className="bg-zinc-900 rounded-lg px-3 py-2.5">
            <div className="text-zinc-300 text-sm font-medium truncate">{user.shopName || "My Shop"}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-1.5 py-0.5 rounded font-mono uppercase font-semibold ${planColors[user.plan]}`}>
                {user.plan}
              </span>
              <span className="text-zinc-600 text-xs">{user.name}</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {nav.map(({ href, icon: Icon, label, desc }) => {
            const active = location === href || (href !== "/" && location.startsWith(href));
            return (
              <Link key={href} href={href}>
                <a className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group cursor-pointer ${
                  active
                    ? "bg-amber-500/15 text-amber-400 border border-amber-500/25"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 border border-transparent"
                }`}>
                  <Icon size={16} className={active ? "text-amber-400" : "text-zinc-500 group-hover:text-zinc-300"} />
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium leading-none ${active ? "text-amber-400" : ""}`}>{label}</div>
                    <div className="text-xs text-zinc-600 mt-0.5">{desc}</div>
                  </div>
                  {active && <ChevronRight size={12} className="text-amber-500" />}
                </a>
              </Link>
            );
          })}
        </nav>

        <div className="px-3 pb-4 border-t border-zinc-800/60 pt-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900/50 border border-zinc-800">
            <Activity size={12} className="text-emerald-400" />
            <span className="text-xs text-zinc-500 font-mono">System Online</span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full mt-2 flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-950/30 transition-all text-sm"
          >
            <LogOut size={15} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 md:ml-64 min-h-screen pb-16 md:pb-0">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/issues" component={Issues} />
          <Route path="/customers" component={Customers} />
          <Route path="/jobs" component={Jobs} />
          <Route path="/schedule" component={Schedule} />
          <Route path="/emails" component={Emails} />
          <Route path="/estimator" component={Estimator} />
          <Route path="/layout" component={Layout} />
          <Route path="/import" component={Import} />
          <Route path="/billing" component={Billing} />
          <Route path="/inventory" component={Inventory} />
          <Route path="/quickbooks" component={QuickBooks} />
          <Route path="/track" component={CustomerPortal} />
          <Route path="/silica" component={Silica} />
          <Route path="/landing" component={Landing} />
          <Route path="/resources" component={Resources} />
          <Route path="/sales" component={Sales} />
          <Route path="/pricebook" component={PriceBook} />
          <Route path="/intelligence" component={Intelligence} />
          <Route path="/settings" component={Settings} />
        </Switch>
      </main>
      <MobileNav />
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.user) setUser(data.user); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={{ user, setUser, loading }}>
        <AppContent />
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}