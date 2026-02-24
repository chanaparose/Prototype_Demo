import { Outlet, NavLink, useLocation } from "react-router";
import { Home, ClipboardList, Package, MessageSquare, User, Plus } from "lucide-react";
import { cn } from "../utils/cn";
import { motion, AnimatePresence } from "motion/react";

const NAV_ITEMS = [
  { icon: Home, label: "Explore", path: "/" },
  { icon: ClipboardList, label: "My RFQs", path: "/rfqs" },
  { icon: Package, label: "Orders", path: "/orders" },
  { icon: MessageSquare, label: "Messages", path: "/messages" },
  { icon: User, label: "Profile", path: "/profile" },
];

export function MainLayout() {
  const location = useLocation();
  const isCreateRfq = location.pathname.startsWith("/create");

  return (
    <div className="relative min-h-screen w-full bg-[#FAFAFD] text-slate-800 font-sans overflow-x-hidden pb-24">
      {/* Background Gradients to match "ref theme" */}
      <div className="fixed inset-0 pointer-events-none z-[-1] opacity-60">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-200/40 rounded-full blur-3xl mix-blend-multiply" />
        <div className="absolute top-[10%] right-[-10%] w-[60%] h-[60%] bg-purple-200/50 rounded-full blur-3xl mix-blend-multiply" />
        <div className="absolute bottom-[-10%] right-[10%] w-[50%] h-[50%] bg-yellow-100/50 rounded-full blur-3xl mix-blend-multiply" />
      </div>

      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="w-full h-full min-h-screen"
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>

      {/* Bottom Navigation Bar */}
      {!isCreateRfq && (
        <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-2">
          <div className="bg-white/90 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-full border border-white/50 px-6 py-4 flex items-center justify-between mx-auto max-w-md">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center justify-center gap-1 transition-all duration-300 relative",
                    isActive ? "text-[#6A35FF]" : "text-slate-400 hover:text-slate-600"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="relative">
                      {isActive && (
                        <motion.div
                          layoutId="nav-pill"
                          className="absolute -inset-2 bg-[#6A35FF]/10 rounded-full z-[-1]"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                      <item.icon size={24} className={cn(isActive && "fill-[#6A35FF]/20")} />
                    </div>
                    {isActive && (
                       <span className="text-[10px] font-semibold tracking-wide absolute -bottom-5">
                         {item.label}
                       </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
