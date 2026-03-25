import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  CalendarCheck, 
  History, 
  Activity, 
  Brain, 
  Briefcase, 
  Target,
  Menu,
  X,
  LogOut,
  Dumbbell
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "./Button";
import { getCycleInfo } from "@/lib/cycle";

const navItems = [
  { name: "Início", path: "/", icon: LayoutDashboard },
  { name: "Check-in", path: "/check-in", icon: CalendarCheck },
  { name: "Treinos", path: "/treinos", icon: Dumbbell },
  { name: "Corpo", path: "/corpo", icon: Activity },
  { name: "Alma", path: "/alma", icon: Brain },
  { name: "Metas", path: "/metas", icon: Target },
  { name: "Agência", path: "/agencia", icon: Briefcase },
];

export function Layout({ user, onLogout }: { user: { name: string }, onLogout: () => void }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [userInitials, setUserInitials] = useState(user.name.substring(0, 2).toUpperCase());
  const location = useLocation();
  const navigate = useNavigate();
  const { currentDay, totalDays, cycleProgress } = getCycleInfo();

  const handleLogout = async () => {
    localStorage.removeItem('w12_user');
    onLogout();
    navigate("/");
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen w-full bg-background text-text-main selection:bg-primary selection:text-white pb-24 md:pb-0 md:pl-20 lg:pl-64">
      {/* Desktop Sidebar (Lg screens) */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 bg-surface border-r border-surface-border flex-col z-50">
        <div className="p-8 border-b border-surface-border">
          <span className="font-serif font-bold text-primary tracking-wide text-2xl">12<span className="text-secondary">W</span></span>
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mt-1">Challenge Dashboard</div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-300",
                  isActive 
                    ? "bg-primary text-white shadow-lg shadow-primary/20" 
                    : "text-text-muted hover:bg-surface-hover hover:text-secondary"
                )
              }
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-6 border-t border-surface-border space-y-4">
          <div className="bg-background rounded-2xl p-4 border border-surface-border">
            <div className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2">Progresso Geral</div>
            <div className="h-1.5 w-full bg-surface-border rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${cycleProgress}%` }} />
            </div>
            <div className="mt-2 text-[10px] font-medium text-text-muted">Dia {currentDay} de {totalDays}</div>
          </div>
          
          <Button 
            variant="outline" 
            onClick={handleLogout}
            className="w-full justify-start gap-3 border-none text-text-muted hover:text-red-500 hover:bg-red-50"
          >
            <LogOut className="w-5 h-5" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Desktop Sidebar (Md screens - Icons only) */}
      <aside className="hidden md:flex lg:hidden fixed left-0 top-0 h-full w-20 bg-surface border-r border-surface-border flex-col items-center py-8 z-50">
        <span className="font-serif font-bold text-primary text-2xl mb-10">12<span className="text-secondary">W</span></span>
        <nav className="flex-1 space-y-4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              title={item.name}
              className={({ isActive }) =>
                cn(
                  "flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300",
                  isActive 
                    ? "bg-primary text-white shadow-lg shadow-primary/20" 
                    : "text-text-muted hover:bg-surface-hover hover:text-secondary"
                )
              }
            >
              <item.icon className="w-6 h-6" />
            </NavLink>
          ))}
        </nav>
        
        <button 
          onClick={handleLogout}
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-text-muted hover:text-red-500 hover:bg-red-50 transition-all duration-300"
          title="Sair"
        >
          <LogOut className="w-6 h-6" />
        </button>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-6 left-4 right-4 z-50 bg-surface/80 backdrop-blur-xl border border-surface-border shadow-2xl rounded-3xl px-2 py-2 flex items-center justify-around">
        {navItems.filter(item => ["Início", "Treinos", "Check-in", "Corpo", "Alma"].includes(item.name)).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300",
                isActive 
                  ? "bg-primary text-white shadow-lg shadow-primary/20" 
                  : "text-text-muted hover:text-secondary"
              )
            }
          >
            <item.icon className="w-6 h-6" />
            <span className="text-[10px] font-bold mt-1 uppercase tracking-tighter">{item.name === "Início" ? "Home" : item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Mobile Top Header */}
      <header className={cn(
        "md:hidden fixed top-0 left-0 w-full z-40 px-6 py-4 flex items-center justify-between transition-all duration-300",
        isScrolled ? "bg-surface/80 backdrop-blur-md border-b border-surface-border" : "bg-transparent"
      )}>
        <span className="font-serif font-bold text-primary text-xl tracking-wide">12<span className="text-secondary">W</span></span>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Dia {currentDay}</div>
            <div className="text-xs font-serif font-bold text-primary">Ciclo 1</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs">
            {userInitials}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 md:pt-12 px-6 md:px-10 lg:px-16 w-full animate-in fade-in duration-700">
        <Outlet />
      </main>
    </div>
  );
}
