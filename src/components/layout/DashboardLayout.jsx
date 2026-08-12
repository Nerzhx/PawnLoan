import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Megaphone,
  HeartHandshake,
  Wallet,
  Settings,
  Menu,
  X,
} from 'lucide-react';

const NAV_LINKS = [
  { to: '/dashboard',            label: 'Overview',      icon: LayoutDashboard, end: true },
  { to: '/dashboard/campaigns',  label: 'My Campaigns',  icon: Megaphone },
  { to: '/dashboard/donations',  label: 'Donations',     icon: HeartHandshake },
  { to: '/dashboard/wallet',     label: 'Wallet',        icon: Wallet },
  { to: '/dashboard/settings',   label: 'Settings',      icon: Settings },
];

export default function DashboardLayout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed z-30 inset-y-0 left-0 w-60 bg-white border-r border-slate-200
          flex flex-col transition-transform duration-200
          lg:static lg:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo / close row */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-slate-200">
          <span className="text-lg font-bold text-slate-900">PawnLoan</span>
          <button
            className="lg:hidden text-slate-500 hover:text-slate-700"
            onClick={() => setOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-1 px-3 overflow-y-auto">
          {NAV_LINKS.map((link) => {
            const LinkIcon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                   ${isActive
                     ? 'bg-indigo-50 text-indigo-700'
                     : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`
                }
              >
                <LinkIcon className="w-4 h-4 flex-shrink-0" />
                {link.label}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center h-14 px-4 border-b border-slate-200 bg-white">
          <button
            onClick={() => setOpen(true)}
            aria-label="Open sidebar"
            className="text-slate-500 hover:text-slate-700"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="ml-3 font-semibold text-slate-800">PawnLoan</span>
        </header>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
