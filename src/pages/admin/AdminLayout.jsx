import React, { lazy, Suspense, useState, useEffect, useCallback } from 'react';
import { Routes, Route, Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  FiGrid,
  FiFolder,
  FiPackage,
  FiPercent,
  FiImage,
  FiDroplet,
  FiUsers,
  FiShoppingCart,
  FiLink,
  FiFileText,
  FiLogOut,
  FiMenu,
  FiX,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

/* ------------------------------------------------------------------ */
/*  Lazy-loaded admin pages                                           */
/* ------------------------------------------------------------------ */
const AdminDashboard  = lazy(() => import('./AdminDashboard'));
const AdminCategories = lazy(() => import('./AdminCategories'));
const AdminProducts   = lazy(() => import('./AdminProducts'));
const AdminDiscounts  = lazy(() => import('./AdminDiscounts'));
const AdminBanners    = lazy(() => import('./AdminBanners'));
const AdminTheme      = lazy(() => import('./AdminTheme'));
const AdminUsers      = lazy(() => import('./AdminUsers'));
const AdminOrders     = lazy(() => import('./AdminOrders'));
const AdminSettings   = lazy(() => import('./AdminSettings'));
const AdminAuditLogs  = lazy(() => import('./AdminAuditLogs'));

/* ------------------------------------------------------------------ */
/*  Navigation config — single source of truth                        */
/* ------------------------------------------------------------------ */
const NAV_ITEMS = [
  { label: 'Dashboard',        to: '/admin',            icon: FiGrid         },
  { label: 'Categories',       to: '/admin/categories',  icon: FiFolder       },
  { label: 'Products',         to: '/admin/products',    icon: FiPackage      },
  { label: 'Discounts',        to: '/admin/discounts',   icon: FiPercent      },
  { label: 'Banners',          to: '/admin/banners',     icon: FiImage        },
  { label: 'Theme',            to: '/admin/theme',       icon: FiDroplet      },
  { label: 'Users',            to: '/admin/users',       icon: FiUsers        },
  { label: 'Orders',           to: '/admin/orders',      icon: FiShoppingCart  },
  { label: 'Footer & Policies', to: '/admin/settings',   icon: FiLink         },
  { label: 'Audit Logs',       to: '/admin/audit-logs',  icon: FiFileText     },
];

/* ------------------------------------------------------------------ */
/*  Shared loading spinner                                            */
/* ------------------------------------------------------------------ */
function Spinner({ className = '' }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-indigo-600" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sidebar content (reused for desktop & mobile drawer)              */
/* ------------------------------------------------------------------ */
function SidebarContent({ pathname, user, onLogout, onLinkClick }) {
  /**
   * For the "Dashboard" item we need an exact match (/admin),
   * whereas every other item just needs a startsWith check.
   */
  const isActive = useCallback(
    (to) => (to === '/admin' ? pathname === '/admin' : pathname.startsWith(to)),
    [pathname],
  );

  return (
    <div className="flex h-full flex-col">
      {/* ---- Brand ---- */}
      <div className="px-4 py-5">
        <h1 className="text-xl font-bold tracking-wide text-white">RHINENIX</h1>
        <p className="mt-0.5 text-xs font-medium uppercase tracking-widest text-gray-400">
          Admin
        </p>
      </div>

      {/* ---- Nav links ---- */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {NAV_ITEMS.map(({ label, to, icon: Icon }) => {
          const active = isActive(to);
          return (
            <Link
              key={to}
              to={to}
              onClick={onLinkClick}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
              }`}
            >
              <Icon className="h-[18px] w-[18px] flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* ---- User footer ---- */}
      <div className="border-t border-gray-700/60 px-4 py-4">
        <p className="truncate text-sm font-medium text-gray-200">
          {user?.name || user?.email || 'Admin'}
        </p>
        <button
          type="button"
          onClick={onLogout}
          className="mt-2 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-gray-400 transition-colors hover:bg-gray-800/50 hover:text-white"
        >
          <FiLogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main layout component                                             */
/* ------------------------------------------------------------------ */
export default function AdminLayout() {
  const { user, loading, isAdmin, logout } = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close mobile drawer whenever the route changes
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  /* ---- Auth guard ---- */
  if (loading) {
    return <Spinner className="min-h-screen" />;
  }

  if (!isAdmin) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* ============================================================ */}
      {/*  DESKTOP SIDEBAR — hidden below md                          */}
      {/* ============================================================ */}
      <aside className="hidden md:flex md:w-64 md:flex-shrink-0 md:flex-col bg-gray-900">
        <SidebarContent
          pathname={location.pathname}
          user={user}
          onLogout={handleLogout}
          onLinkClick={undefined}
        />
      </aside>

      {/* ============================================================ */}
      {/*  MOBILE DRAWER — visible below md when open                 */}
      {/* ============================================================ */}

      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 md:hidden ${
          drawerOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />

      {/* Slide-in panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-gray-900 transition-transform duration-300 ease-in-out md:hidden ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Close button inside drawer */}
        <button
          type="button"
          onClick={() => setDrawerOpen(false)}
          className="absolute right-3 top-4 rounded-md p-1 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
          aria-label="Close sidebar"
        >
          <FiX className="h-5 w-5" />
        </button>

        <SidebarContent
          pathname={location.pathname}
          user={user}
          onLogout={handleLogout}
          onLinkClick={() => setDrawerOpen(false)}
        />
      </aside>

      {/* ============================================================ */}
      {/*  MAIN CONTENT AREA                                          */}
      {/* ============================================================ */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* ---- Top header bar ---- */}
        <header className="flex h-14 flex-shrink-0 items-center gap-3 border-b bg-white px-4 shadow-sm md:h-16 md:px-6">
          {/* Hamburger — mobile only */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 md:hidden"
            aria-label="Open sidebar"
          >
            <FiMenu className="h-5 w-5" />
          </button>

          <h1 className="text-lg font-semibold text-gray-800">RHINENIX Admin</h1>
        </header>

        {/* ---- Page content ---- */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Suspense fallback={<Spinner className="py-20" />}>
            <Routes>
              <Route index                element={<AdminDashboard />}  />
              <Route path="categories"    element={<AdminCategories />} />
              <Route path="products"      element={<AdminProducts />}   />
              <Route path="discounts"     element={<AdminDiscounts />}  />
              <Route path="banners"       element={<AdminBanners />}    />
              <Route path="theme"         element={<AdminTheme />}      />
              <Route path="users"         element={<AdminUsers />}      />
              <Route path="orders"        element={<AdminOrders />}     />
              <Route path="settings"      element={<AdminSettings />}   />
              <Route path="audit-logs"    element={<AdminAuditLogs />}  />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
}
