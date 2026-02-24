import { Outlet, useLocation } from "react-router";
import { BottomNav } from "../components/BottomNav";

export function AppLayout() {
  const location = useLocation();
  // Hide BottomNav on these specific nested routes
  const hideNavRoutes = ['/rfq/new', '/rfqs/compare', '/messages/chat'];
  const shouldHideNav = hideNavRoutes.some(path => location.pathname.includes(path));

  return (
    <div className="flex justify-center min-h-screen bg-slate-100 font-['Plus_Jakarta_Sans'] text-slate-900 overflow-x-hidden relative">
      <div className="w-full max-w-md bg-slate-50 relative min-h-screen shadow-2xl flex flex-col overflow-hidden">
        
        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden pb-24 scrollbar-hide bg-gradient-to-br from-indigo-50/50 via-white to-fuchsia-50/30">
          <Outlet />
        </div>

        {/* Bottom Navigation */}
        {!shouldHideNav && <BottomNav />}
      </div>
    </div>
  );
}
