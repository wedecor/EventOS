import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../shared/auth/AuthContext';
import { useMe } from '../shared/auth/useMe';

const navClass = ({ isActive }: { isActive: boolean }) =>
  [
    'rounded-md px-3 py-2 text-sm font-medium',
    isActive
      ? 'bg-brand-700 text-white'
      : 'text-slate-700 hover:bg-slate-200',
  ].join(' ');

export function AppShell() {
  const { logout } = useAuth();
  const meQuery = useMe();

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-6">
            <span className="text-lg font-semibold text-brand-900">
              Event OS
            </span>
            <nav className="flex gap-1">
              <NavLink to="/" end className={navClass}>
                Home
              </NavLink>
              <NavLink to="/leads" className={navClass}>
                Leads
              </NavLink>
              <NavLink to="/clients" className={navClass}>
                Clients
              </NavLink>
              <NavLink to="/suggestions" className={navClass}>
                Suggestions
              </NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {meQuery.data ? (
              <span className="hidden text-sm text-slate-600 sm:inline">
                {meQuery.data.name}
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
