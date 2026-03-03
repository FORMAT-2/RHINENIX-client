import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiUsers,
  FiShoppingCart,
  FiDollarSign,
  FiPackage,
  FiPlus,
  FiArrowRight,
} from 'react-icons/fi';
import api from '../../utils/api';
import toast from 'react-hot-toast';

/* ------------------------------------------------------------------ */
/*  Status badge colour map                                           */
/* ------------------------------------------------------------------ */
const STATUS_STYLES = {
  pending:    'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100   text-blue-800',
  shipped:    'bg-purple-100 text-purple-800',
  delivered:  'bg-green-100  text-green-800',
  cancelled:  'bg-red-100    text-red-800',
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */
const formatCurrency = (amount) => `₹${Number(amount).toLocaleString('en-IN')}`;

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

const StatusBadge = ({ status }) => {
  const base = 'inline-block rounded-full px-3 py-0.5 text-xs font-semibold capitalize whitespace-nowrap';
  const colour = STATUS_STYLES[status] || 'bg-gray-100 text-gray-800';
  return <span className={`${base} ${colour}`}>{status}</span>;
};

/* ------------------------------------------------------------------ */
/*  Skeleton – Loading State                                          */
/* ------------------------------------------------------------------ */
const SkeletonKPICards = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
    {Array.from({ length: 4 }).map((_, i) => (
      <div
        key={i}
        className="animate-pulse bg-white rounded-xl shadow-sm p-6 space-y-4"
      >
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-20 bg-gray-200 rounded" />
            <div className="h-6 w-28 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

const SkeletonTable = () => (
  <div className="animate-pulse bg-white rounded-xl shadow-sm p-6 space-y-4">
    <div className="h-5 w-40 bg-gray-200 rounded" />
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex gap-4">
        <div className="h-4 w-24 bg-gray-200 rounded" />
        <div className="h-4 w-32 bg-gray-200 rounded" />
        <div className="h-4 w-20 bg-gray-200 rounded" />
        <div className="h-4 w-20 bg-gray-200 rounded" />
        <div className="h-4 w-24 bg-gray-200 rounded" />
      </div>
    ))}
  </div>
);

/* ------------------------------------------------------------------ */
/*  KPI Card                                                          */
/* ------------------------------------------------------------------ */
const KPICard = ({ icon: Icon, label, value, colour }) => {
  // colour is a Tailwind colour key, e.g. "blue", "green", "purple", "orange"
  const bgMap = {
    blue:   'bg-blue-100   text-blue-600',
    green:  'bg-green-100  text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div
        className={`flex items-center justify-center h-12 w-12 rounded-full ${bgMap[colour] || bgMap.blue}`}
      >
        <Icon className="h-5 w-5" />
      </div>

      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Recent Orders – Desktop Table                                     */
/* ------------------------------------------------------------------ */
const OrdersTable = ({ orders }) => (
  <div className="hidden md:block overflow-x-auto">
    <table className="w-full text-left">
      <thead>
        <tr className="border-b border-gray-200 text-sm text-gray-500">
          <th className="pb-3 pr-4 font-medium">Order #</th>
          <th className="pb-3 pr-4 font-medium">Customer</th>
          <th className="pb-3 pr-4 font-medium">Amount</th>
          <th className="pb-3 pr-4 font-medium">Status</th>
          <th className="pb-3 font-medium">Date</th>
        </tr>
      </thead>
      <tbody className="text-sm text-gray-700">
        {orders.map((order) => (
          <tr
            key={order._id}
            className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
          >
            <td className="py-3 pr-4 font-medium text-gray-900">
              {order.orderNumber}
            </td>
            <td className="py-3 pr-4">{order.userId?.name ?? '—'}</td>
            <td className="py-3 pr-4 font-medium">
              {formatCurrency(order.totalAmount)}
            </td>
            <td className="py-3 pr-4">
              <StatusBadge status={order.orderStatus} />
            </td>
            <td className="py-3">{formatDate(order.createdAt)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Recent Orders – Mobile Cards                                      */
/* ------------------------------------------------------------------ */
const OrderCards = ({ orders }) => (
  <div className="md:hidden space-y-3">
    {orders.map((order) => (
      <div
        key={order._id}
        className="rounded-lg border border-gray-200 p-4 space-y-2"
      >
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-900">
            {order.orderNumber}
          </span>
          <StatusBadge status={order.orderStatus} />
        </div>

        <div className="text-sm text-gray-600">
          {order.userId?.name ?? '—'}
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-gray-900">
            {formatCurrency(order.totalAmount)}
          </span>
          <span className="text-gray-400">{formatDate(order.createdAt)}</span>
        </div>
      </div>
    ))}
  </div>
);

/* ------------------------------------------------------------------ */
/*  Quick Actions                                                     */
/* ------------------------------------------------------------------ */
const QuickActions = () => (
  <div className="flex flex-wrap gap-3">
    <Link
      to="/admin/products"
      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
    >
      <FiPlus className="h-4 w-4" />
      Add Product
    </Link>

    <Link
      to="/admin/categories"
      className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-purple-700 transition-colors"
    >
      <FiPlus className="h-4 w-4" />
      Add Category
    </Link>

    <Link
      to="/admin/orders"
      className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700 transition-colors"
    >
      <FiArrowRight className="h-4 w-4" />
      View All Orders
    </Link>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Main Component                                                    */
/* ------------------------------------------------------------------ */
export default function AdminDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const { data } = await api.get('/admin/dashboard/metrics');
        setMetrics(data.data);
      } catch (err) {
        const message =
          err.response?.data?.message ||
          err.message ||
          'Failed to load dashboard metrics';
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  /* ----- Loading skeleton ----- */
  if (loading) {
    return (
      <div className="space-y-8 p-4 sm:p-6 lg:p-8">
        <div>
          <div className="animate-pulse h-7 w-48 bg-gray-200 rounded" />
          <div className="animate-pulse h-4 w-64 bg-gray-200 rounded mt-2" />
        </div>
        <SkeletonKPICards />
        <SkeletonTable />
      </div>
    );
  }

  /* ----- Empty state ----- */
  if (!metrics) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
        <FiPackage className="h-16 w-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">
          No dashboard data available
        </h2>
        <p className="text-gray-500 mt-1">
          Please try again later or contact support.
        </p>
      </div>
    );
  }

  const {
    totalUsers = 0,
    totalOrders = 0,
    totalRevenue = 0,
    totalProducts = 0,
    recentOrders = [],
  } = metrics;

  const latestOrders = recentOrders.slice(0, 5);

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      {/* ---- Header ---- */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Welcome back — here's what's happening with your store.
        </p>
      </div>

      {/* ---- KPI Cards ---- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          icon={FiUsers}
          label="Total Users"
          value={totalUsers.toLocaleString('en-IN')}
          colour="blue"
        />
        <KPICard
          icon={FiShoppingCart}
          label="Total Orders"
          value={totalOrders.toLocaleString('en-IN')}
          colour="green"
        />
        <KPICard
          icon={FiDollarSign}
          label="Total Revenue"
          value={formatCurrency(totalRevenue)}
          colour="purple"
        />
        <KPICard
          icon={FiPackage}
          label="Total Products"
          value={totalProducts.toLocaleString('en-IN')}
          colour="orange"
        />
      </div>

      {/* ---- Quick Actions ---- */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Quick Actions
        </h2>
        <QuickActions />
      </div>

      {/* ---- Recent Orders ---- */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Orders
          </h2>
          <Link
            to="/admin/orders"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
          >
            View all <FiArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {latestOrders.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            No orders yet.
          </p>
        ) : (
          <>
            <OrdersTable orders={latestOrders} />
            <OrderCards orders={latestOrders} />
          </>
        )}
      </div>
    </div>
  );
}
