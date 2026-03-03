import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';

/* ── Lazy-loaded pages ────────────────────────────────────── */
const HomePage        = lazy(() => import('./pages/HomePage'));
const CategoryPage    = lazy(() => import('./pages/CategoryPage'));
const ProductPage     = lazy(() => import('./pages/ProductPage'));
const SearchPage      = lazy(() => import('./pages/SearchPage'));
const CartPage        = lazy(() => import('./pages/CartPage'));
const CheckoutPage    = lazy(() => import('./pages/CheckoutPage'));
const LoginPage       = lazy(() => import('./pages/LoginPage'));
const ProfilePage     = lazy(() => import('./pages/ProfilePage'));
const AddressesPage   = lazy(() => import('./pages/AddressesPage'));
const OrdersPage      = lazy(() => import('./pages/OrdersPage'));
const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage'));
const PolicyPage      = lazy(() => import('./pages/PolicyPage'));
const NotFoundPage    = lazy(() => import('./pages/NotFoundPage'));
const AdminLayout     = lazy(() => import('./pages/admin/AdminLayout'));

/* ── Spinner for Suspense fallback ────────────────────────── */
function LoadingSpinner() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-500" />
    </div>
  );
}

/* ── App ──────────────────────────────────────────────────── */
export default function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Admin routes – own layout */}
        <Route path="/admin/*" element={<AdminLayout />} />

        {/* Public / authenticated routes – wrapped in Layout */}
        <Route
          path="*"
          element={
            <Layout>
              <Routes>
                <Route index element={<HomePage />} />
                <Route path="category/:slug" element={<CategoryPage />} />
                <Route path="product/:slug"   element={<ProductPage />} />
                <Route path="search"           element={<SearchPage />} />
                <Route path="cart"             element={<CartPage />} />
                <Route path="checkout"         element={<CheckoutPage />} />
                <Route path="login"            element={<LoginPage />} />
                <Route path="profile"          element={<ProfilePage />} />
                <Route path="profile/addresses" element={<AddressesPage />} />
                <Route path="orders"           element={<OrdersPage />} />
                <Route path="orders/:id"       element={<OrderDetailPage />} />
                <Route path="policies/:slug"   element={<PolicyPage />} />
                <Route path="*"                element={<NotFoundPage />} />
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </Suspense>
  );
}
