import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const navLinks = [
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Popups', path: '/popups' },
  { name: 'Leads', path: '/leads' },
  { name: 'Analytics', path: '/analytics' },
  { name: 'Settings', path: '/settings' },
];

function NavItems({ location, onNavigate }) {
  return navLinks.map(link => {
    const isActive = location.pathname.startsWith(link.path);
    return (
      <Link
        key={link.name}
        to={link.path}
        onClick={onNavigate}
        className={`flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
          isActive
            ? 'bg-slate-900 text-white'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        {link.name}
      </Link>
    );
  });
}

export default function AppLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleLogout = () => {
    logout();
    localStorage.removeItem('workspaceId');
    localStorage.removeItem('siteId');
    navigate('/login');
  };

  const pageName = navLinks.find(link => location.pathname.startsWith(link.path))?.name || 'Workspace';

  return (
    <div className="pl-shell lg:flex">
      <aside className="hidden lg:flex lg:min-h-screen lg:w-64 lg:flex-col lg:justify-between lg:border-r lg:border-black/5 lg:bg-white">
        <div>
          <div className="border-b border-black/5 px-6 py-6">
            <img src="https://res.cloudinary.com/ddqqlfsjp/image/upload/v1783415005/Screenshot_2026-07-07_at_2.30.36_PM_ss7o0b.png" alt="PopLayer" className="h-10" />
            <p className="mt-1 text-sm text-slate-500">Popup and lead capture</p>
          </div>

          <nav className="px-4 py-5">
            <div className="mb-3 px-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Navigation
            </div>
            <div className="space-y-1">
              <NavItems location={location} />
            </div>
          </nav>
        </div>

        <div className="border-t border-black/5 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">
              {user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-slate-900">{user?.name || 'Workspace owner'}</div>
              <div className="truncate text-xs text-slate-500">{user?.email}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="pl-button pl-button-secondary mt-4 w-full"
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-black/5 bg-white/95 backdrop-blur-xl lg:hidden">
          <div className="flex items-center justify-between px-4 py-4">
            <div>
              <img src="https://res.cloudinary.com/ddqqlfsjp/image/upload/v1783415005/Screenshot_2026-07-07_at_2.30.36_PM_ss7o0b.png" alt="PopLayer" className="h-7" />
            </div>
            <button
              type="button"
              onClick={() => setMobileNavOpen(open => !open)}
              className="pl-button pl-button-secondary min-h-10 px-4"
            >
              Menu
            </button>
          </div>
        </header>

        {mobileNavOpen && <div className="fixed inset-0 z-40 bg-slate-900/20 lg:hidden" onClick={() => setMobileNavOpen(false)} />}
        <div className={`fixed inset-y-0 left-0 z-50 flex flex-col w-72 max-w-[86vw] border-r border-black/5 bg-white transition-transform duration-200 lg:hidden ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="flex items-center justify-between border-b border-black/5 px-5 py-5">
            <div>
              <img src="https://res.cloudinary.com/ddqqlfsjp/image/upload/v1783415005/Screenshot_2026-07-07_at_2.30.36_PM_ss7o0b.png" alt="PopLayer" className="h-8" />
            </div>
            <button
              type="button"
              onClick={() => setMobileNavOpen(false)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600"
            >
              Close
            </button>
          </div>
          <div className="px-4 py-5">
            <div className="mb-3 px-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Navigation
            </div>
            <div className="space-y-1">
              <NavItems location={location} onNavigate={() => setMobileNavOpen(false)} />
            </div>
          </div>
          <div className="mt-auto border-t border-black/5 px-4 py-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">
                {user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-slate-900">{user?.name || 'Workspace owner'}</div>
                <div className="truncate text-xs text-slate-500">{user?.email}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="pl-button pl-button-secondary w-full"
            >
              Sign out
            </button>
          </div>
        </div>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
