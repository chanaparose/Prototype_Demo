import { NavLink } from "react-router";
import { Compass, FileText, Package, MessageSquare, User } from "lucide-react";
import { cn } from "../utils/cn";

const navItems = [
  { path: "/", label: "Explore", icon: Compass },
  { path: "/rfqs", label: "My RFQs", icon: FileText },
  { path: "/orders", label: "Orders", icon: Package },
  { path: "/messages", label: "Messages", icon: MessageSquare },
  { path: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  return (
    <nav className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 px-6 py-4 flex justify-between items-center z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] rounded-t-3xl">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === "/"}
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center gap-1.5 transition-all duration-300 w-16",
              isActive ? "text-violet-600 scale-105" : "text-slate-400 hover:text-slate-600 hover:scale-105"
            )
          }
        >
          {({ isActive }) => (
            <>
              <div
                className={cn(
                  "p-2 rounded-2xl transition-all duration-300 flex items-center justify-center",
                  isActive ? "bg-violet-100/80 shadow-inner" : "bg-transparent"
                )}
              >
                <item.icon
                  size={isActive ? 24 : 22}
                  className={cn(
                    "transition-all duration-300",
                    isActive && "fill-violet-100"
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </div>
              <span
                className={cn(
                  "text-[10px] font-semibold transition-all duration-300",
                  isActive ? "opacity-100 -translate-y-1" : "opacity-70"
                )}
              >
                {item.label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
