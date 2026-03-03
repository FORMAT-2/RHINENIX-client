import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiPackage,
  FiTruck,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiLoader,
  FiChevronRight,
  FiRefreshCw,
  FiShoppingBag,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import SITE from '../config/site.constants';

/* ═══════════════════════════════════════════════════════════════════
   CONSTANTS & HELPERS
   ═══════════════════════════════════════════════════════════════════ */
const fmt = (amt) =>
  `${SITE.CURRENCY}${Number(amt || 0).toLocaleString('en-IN')}`;

const PAGE_LIMIT = 10;

const ACTIVE_STATUSES = ['placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery'];

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
];

const STATUS_CONFIG = {
  placed:           { color: 'bg-yellow-100 text-yellow-800', icon: FiClock,       label: 'Placed' },
  confirmed:        { color: 'bg-blue-100 text-blue-800',     icon: FiCheckCircle, label: 'Confirmed' },
  packed:           { color: 'bg-blue-100 text-blue-800',     icon: FiPackage,     label: 'Packed' },
  shipped:          { color: 'bg-blue-100 text-blue-800',     icon: FiTruck,       label: 'Shipped' },
  out_for_delivery: { color: 'bg-blue-100 text-blue-800',     icon: FiTruck,       label: 'Out for Delivery' },
  delivered:        { color: 'bg-green-100 text-green-800',   icon: FiCheckCircle, label: 'Delivered' },
  cancelled:        { color: 'bg-red-100 text-red-800',       icon: FiXCircle,     label: 'Cancelled' },
  returned:         { color: 'bg-gray-100 text-gray-800',     icon: FiRefreshCw,   label: 'Returned' },
};

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/* ═══════════════════════════════════════════════════════════════════
   SKELETON
   ═══════════════════════════════════════════════════════════════════ */
const Sk = ({ className = '' }) => (
  <div className={`animate-pulse rounded-lg bg-gray-200 ${className}`} />
);

function OrdersSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Sk className="mb-6 h-8 w-40" />
      <div className="mb-6 flex gap-2">
        {[1, 2, 3, 4].map((i) => <Sk key={i} className="h-9 w-20 !rounded-full" />)}
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-gray-100 bg-white p-5">
            <div className="flex items-center justify-between">
              <Sk className="h-5 w-36" />
              <Sk className="h-6 w-20 !rounded-full" />
            </div>
            <Sk className="mt-3 h-4 w-48" />
            <div className="mt-3 flex gap-2">
              <Sk className="h-12 w-12 !rounded-lg" />
              <Sk className="h-12 w-12 !rounded-lg" />
            </div>
            <div className="mt-3 flex justify-between">
              <Sk className="h-4 w-24" />
              <Sk className="h-4 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   STATUS BADGE
   ═══════════════════════════════════════════════════════════════════ */
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.placed;
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${cfg.color}`}
    >
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ORDER CARD
   ═══════════════════════════════════════════════════════════════════ */
function OrderCard({ order }) {
  const isActive = ACTIVE_STATUSES.includes(order.orderStatus);
  const itemCount = order.items?.length || 0;
  const thumbs = (order.items || []).slice(0, 3);

  return (
    <Link
      to={`/orders/${order._id}`}
      className="block rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:border-gray-200 hover:shadow-md sm:p-5"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900 sm:text-base">
            {order.orderNumber}
          </p>
          <p className="mt-0.5 text-xs text-gray-500">
            {formatDate(order.createdAt)}
          </p>
        </div>
        <StatusBadge status={order.orderStatus} />
      </div>

      {/* Item thumbnails */}
      <div className="mt-3 flex items-center gap-2">
        {thumbs.map((item, i) => (
          <div
            key={i}
            className="h-12 w-12 overflow-hidden rounded-lg border border-gray-100 bg-gray-50"
          >
            {item.image ? (
              <img src={item.image} alt={item.name} className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <FiPackage className="h-5 w-5 text-gray-300" />
              </div>
            )}
          </div>
        ))}
        {itemCount > 3 && (
          <span className="text-xs font-medium text-gray-500">
            +{itemCount - 3} more
          </span>
        )}
      </div>

      {/* Bottom row */}
      <div className="mt-3 flex items-center justify-between border-t border-gray-50 pt-3">
        <p className="text-xs text-gray-500">
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </p>
        <div className="flex items-center gap-3">
          <p className="text-sm font-bold text-gray-900">
            {fmt(order.pricing?.grandTotal)}
          </p>
          {isActive && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-primary-600">
              Track <FiChevronRight className="h-3 w-3" />
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   EMPTY STATE
   ═══════════════════════════════════════════════════════════════════ */
function EmptyOrders({ tab }) {
  const msgs = {
    all: "You haven't placed any orders yet.",
    active: 'No active orders right now.',
    delivered: 'No delivered orders yet.',
    cancelled: 'No cancelled orders.',
  };

  return (
    <div className="py-16 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
        <FiShoppingBag className="h-10 w-10 text-gray-400" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">No orders found</h3>
      <p className="mt-1 text-sm text-gray-500">{msgs[tab] || msgs.all}</p>
      {tab === 'all' && (
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-600"
        >
          Start Shopping
        </Link>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ORDERS PAGE
   ═══════════════════════════════════════════════════════════════════ */
export default function OrdersPage() {
  const navigate = useNavigate();
  const { loading: authLoading, isAuthenticated } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [tab, setTab] = useState('all');
  const [error, setError] = useState(null);

  /* Redirect unauthenticated */
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login', { replace: true, state: { from: { pathname: '/orders' } } });
    }
  }, [authLoading, isAuthenticated, navigate]);

  /* Fetch orders */
  const fetchOrders = useCallback(
    async (pageNum = 1, append = false) => {
      try {
        setError(null);
        if (pageNum === 1) setLoading(true);
        else setLoadingMore(true);

        const { data } = await api.get(`/orders?page=${pageNum}&limit=${PAGE_LIMIT}`);
        const items = data.data?.items || [];
        const pagination = data.meta?.pagination;

        if (append) {
          setOrders((prev) => [...prev, ...items]);
        } else {
          setOrders(items);
        }
        setPage(pageNum);
        setHasMore(pagination ? pageNum < pagination.totalPages : false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load orders');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (isAuthenticated) fetchOrders(1);
  }, [isAuthenticated, fetchOrders]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) fetchOrders(page + 1, true);
  };

  /* Filter orders by tab */
  const filteredOrders = orders.filter((o) => {
    if (tab === 'all') return true;
    if (tab === 'active') return ACTIVE_STATUSES.includes(o.orderStatus);
    if (tab === 'delivered') return o.orderStatus === 'delivered';
    if (tab === 'cancelled') return o.orderStatus === 'cancelled' || o.orderStatus === 'returned';
    return true;
  });

  /* ── Loading / guard ────────────────────────────────────────── */
  if (authLoading || !isAuthenticated || loading) return <OrdersSkeleton />;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 pb-24 lg:pb-6">
      {/* Header */}
      <h1 className="mb-5 text-xl font-bold text-gray-900 sm:text-2xl">My Orders</h1>

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`shrink-0 rounded-full border-2 px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === t.key
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
          <button type="button" onClick={() => fetchOrders(1)} className="ml-2 font-medium underline">
            Retry
          </button>
        </div>
      )}

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <EmptyOrders tab={tab} />
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <OrderCard key={order._id} order={order} />
          ))}
        </div>
      )}

      {/* Load More */}
      {hasMore && tab === 'all' && (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="inline-flex items-center gap-2 rounded-lg border-2 border-gray-200 px-6 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 disabled:opacity-60"
          >
            {loadingMore ? (
              <>
                <FiLoader className="h-4 w-4 animate-spin" />
                Loading…
              </>
            ) : (
              'Load More Orders'
            )}
          </button>
        </div>
      )}
    </div>
  );
}
