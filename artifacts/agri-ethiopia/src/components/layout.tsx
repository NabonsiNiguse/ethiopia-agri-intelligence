import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  MessageSquare, 
  Leaf, 
  CloudSun, 
  TrendingUp, 
  CheckCircle, 
  Truck, 
  Users, 
  ShieldCheck, 
  Map, 
  Cpu
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/advisory", label: "AI Advisor", icon: MessageSquare },
  { href: "/disease", label: "Disease Detection", icon: Leaf },
  { href: "/weather", label: "Weather Advisory", icon: CloudSun },
  { href: "/market", label: "Market Intel", icon: TrendingUp },
  { href: "/grading", label: "Crop Grading", icon: CheckCircle },
  { href: "/logistics", label: "Tractor Hub", icon: Truck },
  { href: "/forum", label: "Farmer Forum", icon: Users },
  { href: "/traceability", label: "Traceability", icon: Map },
  { href: "/insurance", label: "Micro-Insurance", icon: ShieldCheck },
  { href: "/farmers", label: "Farmer Registry", icon: Users },
  { href: "/architecture", label: "System Arch", icon: Cpu },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-sidebar border-r border-sidebar-border hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2 text-sidebar-primary">
            <Leaf className="w-6 h-6" />
            <span className="font-bold text-lg text-sidebar-foreground tracking-tight">AgriEthio AI</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            {NAV_ITEMS.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                      isActive 
                        ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    }`}
                  >
                    <item.icon className={`w-5 h-5 ${isActive ? "text-sidebar-primary" : "text-sidebar-foreground/60"}`} />
                    {item.label}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-bold">
              AE
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-sidebar-foreground">Extension Office</span>
              <span className="text-xs text-sidebar-foreground/60">Oromia Region</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-muted/30">
        <header className="h-16 bg-card border-b border-border flex items-center px-6 justify-between shrink-0 md:hidden">
           <div className="flex items-center gap-2 text-primary">
            <Leaf className="w-6 h-6" />
            <span className="font-bold text-lg text-foreground tracking-tight">AgriEthio AI</span>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
