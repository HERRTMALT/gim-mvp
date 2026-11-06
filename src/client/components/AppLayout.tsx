import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  CreditCard,
  Dumbbell,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { cn } from '../lib/utils';
import { Button, LinkButton } from './ui';

const NAV_ITEMS = [
  { to: '/', label: 'Panel', icon: LayoutDashboard, end: true },
  { to: '/socios', label: 'Socios', icon: Users, end: false },
  { to: '/planes', label: 'Planes y precios', icon: CreditCard, end: false },
];

function sectionTitle(pathname: string): string {
  if (pathname === '/') return 'Panel';
  if (pathname.startsWith('/socios')) return 'Socios';
  if (pathname.startsWith('/rutinas')) return 'Rutinas';
  if (pathname.startsWith('/planes')) return 'Planes y precios';
  return 'Gestión';
}

function Brand({ gymName }: { gymName: string }) {
  return (
    <Link to="/" className="flex min-w-0 items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
        <Dumbbell className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-base font-bold leading-tight text-slate-900">{gymName}</p>
        <p className="text-xs font-medium text-slate-500">Panel de gestión</p>
      </div>
    </Link>
  );
}

function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="space-y-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                isActive
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
              )
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  );
}

export function AppLayout() {
  const { gymName, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="p-5">
          <Brand gymName={gymName} />
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          <Navigation />
          <div className="mt-6 rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-800">¿Alta de un socio?</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Registrá sus datos, su cuota y generá la rutina desde el mismo perfil.
            </p>
            <Link
              to="/socios/nuevo"
              className="mt-3 flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" /> Nuevo socio
            </Link>
          </div>
        </div>
        <div className="border-t border-slate-200 p-3">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-rose-50 hover:text-rose-700 disabled:opacity-60"
          >
            <LogOut className="h-5 w-5" />
            {loggingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6 lg:hidden">
          <div className="flex min-w-0 items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Abrir menú"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <span className="truncate text-sm font-semibold text-slate-800">
              {sectionTitle(location.pathname)}
            </span>
          </div>
          <LinkButton to="/socios/nuevo" size="sm">
            <Plus className="h-4 w-4" /> Socio
          </LinkButton>
        </header>

        {mobileOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div
              className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="animate-fade-in absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col bg-white shadow-xl">
              <div className="flex items-center justify-between gap-2 border-b border-slate-200 p-4">
                <Brand gymName={gymName} />
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Cerrar menú"
                  onClick={() => setMobileOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                <Navigation onNavigate={() => setMobileOpen(false)} />
              </div>
              <div className="border-t border-slate-200 p-3">
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-rose-50 hover:text-rose-700 disabled:opacity-60"
                >
                  <LogOut className="h-5 w-5" />
                  {loggingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
                </button>
              </div>
            </aside>
          </div>
        )}

        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
