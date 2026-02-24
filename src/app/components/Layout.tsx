import { Outlet, useNavigate, useLocation } from 'react-router';
import { Home, FileText, Package, MessageCircle, User } from 'lucide-react';

const tabs = [
  { path: '/', icon: Home, label: 'Explore' },
  { path: '/rfqs', icon: FileText, label: 'My RFQs' },
  { path: '/orders', icon: Package, label: 'Orders' },
  { path: '/messages', icon: MessageCircle, label: 'Messages' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div
      className="max-w-[430px] mx-auto h-screen flex flex-col overflow-hidden relative"
      style={{
        background: 'linear-gradient(145deg, rgba(236,253,245,0.6) 0%, #ffffff 30%, #ffffff 65%, rgba(237,233,254,0.5) 100%)',
      }}
    >
      {/* Decorative blobs */}
      <div
        className="absolute -top-24 -right-24 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.25) 0%, transparent 70%)' }}
      />
      <div
        className="absolute top-1/3 -left-16 w-48 h-48 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(134,239,172,0.2) 0%, transparent 70%)' }}
      />
      <div
        className="absolute bottom-1/4 -right-10 w-40 h-40 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(251,207,232,0.3) 0%, transparent 70%)' }}
      />

      {/* Main scrollable content */}
      <div className="flex-1 overflow-y-auto relative z-10 pb-2">
        <Outlet />
      </div>

      {/* Bottom Tab Bar */}
      <div className="relative z-20 bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-[0_-4px_24px_rgba(108,71,255,0.08)]">
        <div className="flex items-center justify-around px-1 pt-2 pb-3">
          {tabs.map(({ path, icon: Icon, label }) => {
            const isActive =
              location.pathname === path ||
              (path !== '/' && location.pathname.startsWith(path));
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="flex flex-col items-center gap-0.5 px-3 py-1 transition-all duration-200"
              >
                <div
                  className="p-2 rounded-xl transition-all duration-200"
                  style={{
                    background: isActive ? 'rgba(108,71,255,0.12)' : 'transparent',
                  }}
                >
                  <Icon
                    size={22}
                    strokeWidth={isActive ? 2.5 : 1.8}
                    style={{ color: isActive ? '#6C47FF' : '#9CA3AF' }}
                  />
                </div>
                <span
                  className="text-[10px]"
                  style={{
                    color: isActive ? '#6C47FF' : '#9CA3AF',
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
