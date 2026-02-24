import React from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router";
import { Home, FileText, Package, MessageSquare, User, Plus } from "lucide-react";

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Hide bottom nav on specific pages like Chat Detail or Comparison to give more space
  const hideNav = location.pathname.includes('/messages/') || location.pathname.includes('/compare');

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0fbfa] via-[#f7f0ff] to-[#fffcf0] text-slate-800 font-sans pb-24 relative overflow-x-hidden">
      <Outlet />

      {!hideNav && (
        <div className="fixed bottom-0 left-0 right-0 p-4 pointer-events-none z-50 flex justify-center">
          <nav className="bg-white/90 backdrop-blur-md shadow-[0_10px_40px_-10px_rgba(107,78,255,0.2)] rounded-3xl w-full max-w-md px-6 py-4 flex justify-between items-center pointer-events-auto relative">
            
            <NavLink to="/" className={({ isActive }) => `flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-[#6B4EFF]' : 'text-slate-400 hover:text-slate-600'}`}>
              <Home size={24} className={location.pathname === '/' ? 'fill-current' : ''} />
              <span className="text-[10px] font-medium">Explore</span>
            </NavLink>

            <NavLink to="/rfqs" className={({ isActive }) => `flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-[#6B4EFF]' : 'text-slate-400 hover:text-slate-600'}`}>
              <FileText size={24} className={location.pathname.startsWith('/rfqs') ? 'fill-current' : ''} />
              <span className="text-[10px] font-medium">My RFQs</span>
            </NavLink>

            {/* Quick Create RFQ FAB */}
            <div className="relative -top-8 flex flex-col items-center">
              <button 
                onClick={() => navigate('/create-rfq')}
                className="bg-[#6B4EFF] text-white p-4 rounded-full shadow-lg hover:bg-[#5a40e0] hover:scale-105 transition-all active:scale-95 flex items-center justify-center ring-4 ring-[#f7f0ff]"
              >
                <Plus size={28} />
              </button>
            </div>

            <NavLink to="/orders" className={({ isActive }) => `flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-[#6B4EFF]' : 'text-slate-400 hover:text-slate-600'}`}>
              <Package size={24} className={location.pathname.startsWith('/orders') ? 'fill-current' : ''} />
              <span className="text-[10px] font-medium">Orders</span>
            </NavLink>

            <NavLink to="/messages" className={({ isActive }) => `flex flex-col items-center gap-1 transition-colors relative ${isActive ? 'text-[#6B4EFF]' : 'text-slate-400 hover:text-slate-600'}`}>
              <div className="relative">
                <MessageSquare size={24} className={location.pathname.startsWith('/messages') ? 'fill-current' : ''} />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></span>
              </div>
              <span className="text-[10px] font-medium">Messages</span>
            </NavLink>

          </nav>
        </div>
      )}
    </div>
  );
}
