import { useEffect, useState, type MouseEvent, type ReactNode } from 'react';
import { Badge, Button, useToast } from '@idds/react';
import {
  IconExternalLink,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconLogout,
  IconMenu2,
  IconX,
} from '@tabler/icons-react';
import { Link, navigate, paths, useLocation } from '../lib/router';
import { useAuthenticatedUser, useLogout } from './auth';
import { navItemsFor, type AdminNavItem } from './navigation';

const MAIN_ID = 'konten-admin';
const COLLAPSED_KEY = 'pemdi-admin-sidebar-diciutkan';

// Preferensi tampilan saja: aman bila penyimpanan browser diblokir.
function readCollapsed(): boolean {
  try {
    return window.localStorage.getItem(COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
}

function writeCollapsed(value: boolean) {
  try {
    window.localStorage.setItem(COLLAPSED_KEY, value ? '1' : '0');
  } catch {
    // diabaikan
  }
}

interface SidebarNavProps {
  items: AdminNavItem[];
  pathname: string;
  collapsed?: boolean;
  onNavigate?: () => void;
}

function SidebarNav({ items, pathname, collapsed = false, onNavigate }: SidebarNavProps) {
  return (
    <ul className="flex flex-col gap-1">
      {items.map((item) => {
        const active = item.isActive(pathname);
        const Icon = item.icon;
        return (
          <li key={item.to}>
            <Link
              to={item.to}
              onNavigate={onNavigate}
              aria-current={active ? 'page' : undefined}
              title={collapsed ? item.label : undefined}
              className={`flex h-11 items-center gap-3 rounded-lg px-3 text-caption font-medium transition-colors ${
                collapsed ? 'justify-center' : ''
              } ${
                active
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-content-secondary hover:bg-background-tertiary hover:text-content-primary'
              }`}
            >
              <Icon size={20} aria-hidden="true" className="shrink-0" />
              <span className={collapsed ? 'sr-only' : ''}>{item.label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function SiteLink({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <Link
      to={paths.home}
      title={collapsed ? 'Lihat situs' : undefined}
      className={`flex h-11 items-center gap-3 rounded-lg px-3 text-caption font-medium text-content-secondary transition-colors hover:bg-background-tertiary hover:text-content-primary ${
        collapsed ? 'justify-center' : ''
      }`}
    >
      <IconExternalLink size={20} aria-hidden="true" className="shrink-0" />
      <span className={collapsed ? 'sr-only' : ''}>Lihat situs</span>
    </Link>
  );
}

/**
 * Kerangka panel admin mengikuti pola Sidebar IDDS: menu utama di kiri (bisa diciutkan menjadi
 * ikon saja). Di layar sempit menu dibuka dari tombol di header sebagai panel lipat, sama seperti
 * header situs publik. Drawer IDDS tidak dipakai: di layar <= 640px ia menjadi bottom sheet,
 * tanpa role="dialog", dan fokus keyboard tidak masuk ke dalamnya.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  const user = useAuthenticatedUser();
  const { pathname } = useLocation();
  const { toast } = useToast();
  const logout = useLogout();

  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [menuOpen, setMenuOpen] = useState(false);
  const items = navItemsFor(user.role);
  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [menuOpen]);

  const toggleCollapsed = () => {
    setCollapsed((current) => {
      writeCollapsed(!current);
      return !current;
    });
  };

  const skipToContent = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    document.getElementById(MAIN_ID)?.focus();
  };

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSettled: (_data, error) => {
        navigate(paths.adminLogin, { replace: true });
        toast({
          title: error ? 'Sesi lokal diakhiri' : 'Anda telah keluar',
          description: error
            ? 'Server tidak merespons. Tutup browser bila memakai perangkat bersama.'
            : 'Sampai jumpa kembali.',
          state: error ? 'default' : 'positive',
          duration: 4000,
        });
      },
    });
  };

  return (
    <div className="flex min-h-screen bg-background-secondary text-content-primary">
      <a
        href={`#${MAIN_ID}`}
        onClick={skipToContent}
        className="sr-only rounded-lg bg-background-primary px-4 py-2 text-caption font-semibold text-primary-600 shadow-lg focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100]"
      >
        Lompat ke konten utama
      </a>

      <aside
        className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-stroke-primary bg-background-primary transition-[width] lg:flex ${
          collapsed ? 'w-[76px]' : 'w-64'
        }`}
      >
        <div
          className={`flex h-16 items-center border-b border-stroke-primary ${collapsed ? 'justify-center' : 'gap-3 px-5'}`}
        >
          {/* Saat diciutkan hanya lambang (bagian kiri logo) yang ditampilkan. */}
          <img
            src="/panrb.svg"
            alt=""
            className={collapsed ? 'h-8 w-9 object-cover object-left' : 'h-8 w-auto'}
          />
          {!collapsed && (
            <span className="text-caption font-bold leading-tight">
              CMS <span className="font-normal text-primary-600">PEMDI</span>
            </span>
          )}
        </div>
        <nav aria-label="Menu admin" className="flex-1 overflow-y-auto p-3">
          <SidebarNav items={items} pathname={pathname} collapsed={collapsed} />
        </nav>
        <div className="space-y-1 border-t border-stroke-primary p-3">
          <SiteLink collapsed={collapsed} />
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? 'Lebarkan menu' : 'Ciutkan menu'}
            title={collapsed ? 'Lebarkan menu' : undefined}
            className={`flex h-11 w-full items-center gap-3 rounded-lg px-3 text-caption font-medium text-content-secondary transition-colors hover:bg-background-tertiary hover:text-content-primary ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            {collapsed ? (
              <IconLayoutSidebarLeftExpand size={20} aria-hidden="true" />
            ) : (
              <IconLayoutSidebarLeftCollapse size={20} aria-hidden="true" />
            )}
            {!collapsed && <span>Ciutkan menu</span>}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-stroke-primary bg-background-primary">
          <div className="flex h-16 items-center justify-between gap-4 px-4 lg:px-8">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-label={menuOpen ? 'Tutup menu admin' : 'Buka menu admin'}
                aria-expanded={menuOpen}
                aria-controls="menu-admin-mobile"
                className="inline-flex size-10 items-center justify-center rounded-lg text-content-primary hover:bg-background-tertiary lg:hidden"
              >
                {menuOpen ? (
                  <IconX size={22} aria-hidden="true" />
                ) : (
                  <IconMenu2 size={22} aria-hidden="true" />
                )}
              </button>
              <span className="text-caption font-bold lg:hidden">
                CMS <span className="font-normal text-primary-600">PEMDI</span>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-caption font-semibold leading-tight">{user.name}</p>
                <p className="text-caption-sm text-content-secondary">{user.email}</p>
              </div>
              <Badge variant={user.role === 'admin' ? 'brand' : 'neutral'} size="sm">
                {user.role_label}
              </Badge>
              <Button
                hierarchy="tertiary"
                size="md"
                onClick={handleLogout}
                disabled={logout.isPending}
                prefixIcon={<IconLogout size={18} aria-hidden="true" />}
              >
                Keluar
              </Button>
            </div>
          </div>

          {menuOpen && (
            <div
              id="menu-admin-mobile"
              className="border-t border-stroke-primary px-4 py-3 lg:hidden"
            >
              <nav aria-label="Menu admin" className="flex flex-col gap-1">
                <SidebarNav items={items} pathname={pathname} onNavigate={closeMenu} />
                <SiteLink />
              </nav>
            </div>
          )}
        </header>

        <main id={MAIN_ID} tabIndex={-1} className="flex-1 p-4 focus:outline-none sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
