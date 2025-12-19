import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import logoUrl from "@assets/mylogo_1766177546338.png";
import { 
  LayoutDashboard, 
  Wand2, 
  Gamepad2, 
  Settings2,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Enhancements", icon: Wand2, href: "/enhancements" },
  { label: "Input Tuning", icon: Gamepad2, href: "/tuning" },
  { label: "Profiles", icon: Settings2, href: "/profiles" },
];

export function Sidebar() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-sidebar border border-sidebar-border rounded-md"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar Container */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-300 lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo Area */}
          <div className="h-20 flex items-center px-6 border-b border-sidebar-border/50">
            <div className="w-12 h-12 mr-3 flex items-center justify-center">
              <img 
                src={logoUrl} 
                alt="Logo" 
                className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(16,185,129,0.4)]"
              />
            </div>
            <div>
              <div className="font-bold text-lg tracking-tight text-white leading-none mb-1">Ceil Pro</div>
              <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                LIVE • 60 FPS
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-6 space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <div className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer group",
                    isActive 
                      ? "bg-primary/10 text-primary border border-primary/20 shadow-[inset_0_0_10px_-5px_hsl(var(--primary)/0.3)]" 
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-white"
                  )}>
                    <item.icon className={cn("w-4 h-4", isActive ? "text-primary drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]" : "text-muted-foreground group-hover:text-white")} />
                    {item.label}
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Bottom/Footer Area */}
          <div className="p-4 border-t border-sidebar-border/50 bg-black/20">
            <div className="text-[10px] text-muted-foreground/50 text-center font-mono">
              Build v2.4.1-beta
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
