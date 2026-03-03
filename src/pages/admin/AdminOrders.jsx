import { useState, useEffect, useCallback } from 'react';
import {
  FiSearch,
  FiChevronDown,
  FiChevronUp,
  FiFilter,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi';
import api from '../../utils/api';
import toast from 'react-hot-toast';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */
const PAGE_LIMIT = 20;

const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];

const ORDER_STATUS_STYLES = {
  pending:    'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100   text-blue-800',
  shipped:    'bg-purple-100 text-purple-800',
  delivered:  'bg-green-100  text-green-800',
  cancelled:  'bg-red-100    text-red-800',
};

const PAYMENT_STATUS_STYLES = {
  pending:  'bg-yellow-100 text-yellow-800',
  paid:     'bg-green-100  text-green-800',
  failed:   'bg-red-100    text-red-800',
  refunded: 'bg-orange-100 text-orange-800',
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
const formatCurrency = (amount) =>
  `₹${Number(amount).toLocaleString('en-IN')}`;

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

/* ------------------------------------------------------------------ */
/*  Status Badges                                                      */
/* ------------------------------------------------------------------ */
const BADGE_BASE =
  'inline-block rounded-full px-3 py-0.5 text-xs font-semibold capitalize whitespace-nowrap';

const OrderStatusBadge = ({ status }) => {
  const colour = ORDER_STATUS_STYLES[status] || 'bg-gray-100 text-gray-800';
  return <span className={`${BADGE_BASE} ${colour}`}>{status}</span>;
};

const PaymentStatusBadge = ({ status }) => {
  const colour = PAYMENT_STATUS_STYLES[status] || 'bg-gray-100 text-gray-800';
  return <span className={`${BADGE_BASE} ${colour}`}>{status}</span>;
};

/* ------------------------------------------------------------------ */
/*  Skeleton – Loading State                                           */
/* ------------------------------------------------------------------ */
const SkeletonRow = () => (
  <tr className="border-b border-gray-100">
    {Array.from({ length: 8 }).map((_, i) => (
      <td key={i} className="py-3 pr-4">
        <div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
      </td>
    ))}
  </tr>
);

const SkeletonTable = () => (
  <div className="hidden md:block bg-white rounded-xl shadow-sm p-6">
    <div className="h-5 w-48 bg-gray-200 rounded animate-pulse mb-6" />
    <table className="w-full">
      <tbody>
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </tbody>
    </table>
  </div>
);

const SkeletonCard = () => (
  <div className="animate-pulse rounded-lg border border-gray-200 p-4 space-y-3">
    <div className="flex items-center justify-between">
      <div className="h-4 w-28 bg-gray-200 rounded" />
      <div className="h-5 w-20 bg-gray-200 rounded-full" />
    </div>
    <div className="h-3 w-36 bg-gray-200 rounded" />
    <div className="flex items-center justify-between">
      <div className="h-4 w-20 bg-gray-200 rounded" />
      <div className="h-3 w-24 bg-gray-200 rounded" />
    </div>
  </div>
);

const SkeletonCards = () => (
  <div className="md:hidden space-y-3">
    {Array.from({ length: 4 }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

const SkeletonFilters = () => (
  <div className="flex flex-wrap gap-3 animate-pulse">
    <div className="h-10 w-44 bg-gray-200 rounded-lg" />
    <div className="h-10 w-44 bg-gray-200 rounded-lg" />
  </div>
);

/* ------------------------------------------------------------------ */
/*  Filter Bar                                                         */
/* ------------------------------------------------------------------ */
const FilterBar = ({ orderStatus, paymentStatus, onOrderStatusChange, onPaymentStatusChange }) => (
  <div className="flex flex-wrap items-center gap-3">
    <div className="flex items-center gap-2 text-sm text-gray-500">
      <FiFilter className="h-4 w-4" />
      <span className="hidden sm:inline font-medium">Filters</span>
    </div>

    {/* Order Status */}
    <div className="relative">
      <select
        value={orderStatus}
        onChange={(e) => onOrderStatusChange(e.target.value)}
        className="appearance-none rounded-lg border border-gray-300 bg-white pl-3 pr-8 py-2 text-sm text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer"
      >
        <option value="">All Order Status</option>
        {ORDER_STATUSES.map((s) => (
          <option key={s} value={s} className="capitalize">
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </option>
        ))}
      </select>
      <FiChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
    </div>

    {/* Payment Status */}
    <div className="relative">
      <select
        value={paymentStatus}
        onChange={(e) => onPaymentStatusChange(e.target.value)}
        className="appearance-none rounded-lg border border-gray-300 bg-white pl-3 pr-8 py-2 text-sm text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer"
      >
        <option value="">All Payment Status</option>
        {PAYMENT_STATUSES.map((s) => (
          <option key={s} value={s} className="capitalize">
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </option>
        ))}
      </select>
      <FiChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Order Details – Expanded Row Content                               */
/* ------------------------------------------------------------------ */
const OrderDetails = ({ order }) => (
  <div className="bg-gray-50 rounded-lg p-4 space-y-4 text-sm">
    {/* Shipping Address */}
    <div>
      <h4 className="font-semibold text-gray-900 mb-1">Shipping Address</h4>
      <div className="text-gray-600 space-y-0.5">
        <p>{order.shippingAddress?.fullName}</p>
        <p>{order.shippingAddress?.line1}</p>
        <p>
          {order.shippingAddress?.city}, {order.shippingAddress?.state} –{' '}
          {order.shippingAddress?.pincode}
        </p>
        <p>Phone: {order.shippingAddress?.phone}</p>
      </div>
    </div>

    {/* Items */}
    <div>
      <h4 className="font-semibold text-gray-900 mb-2">Items</h4>
      <div className="space-y-2">
        {order.items?.map((item, idx) => (
          <div
            key={item.productId?._id || idx}
            className="flex items-center justify-between rounded-md bg-white border border-gray-200 px-3 py-2"
          >
            <div className="flex items-center gap-3 min-w-0">
              {item.productId?.images?.[0] && (
                <img
                  src={item.productId.images[0]}
                  alt={item.productId?.name || 'Product'}
                  className="h-10 w-10 rounded object-cover flex-shrink-0"
                />
              )}
              <div className="min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {item.productId?.name || 'Unknown Product'}
                </p>
                <p className="text-gray-500">Qty: {item.quantity}</p>
              </div>
            </div>
            <span className="font-medium text-gray-900 flex-shrink-0 ml-3">
              {formatCurrency(item.price)}
            </span>
          </div>
        ))}
      </div>
    </div>

    {/* Payment Method */}
    <div>
      <h4 className="font-semibold text-gray-900 mb-1">Payment Method</h4>
      <p className="text-gray-600 capitalize">{order.paymentMethod || '—'}</p>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Status Update Dropdown                                             */
/* ------------------------------------------------------------------ */
const StatusUpdateSelect = ({ order, updatingId, onStatusChange }) => {
  const isLocked = order.orderStatus === 'delivered' || order.orderStatus === 'cancelled';
  const isUpdating = updatingId === order._id;

  return (
    <div className="relative">
      <select
        value={order.orderStatus}
        onChange={(e) => onStatusChange(order._id, e.target.value)}
        disabled={isLocked || isUpdating}
        className={`appearance-none rounded-lg border pl-3 pr-8 py-1.5 text-xs font-medium outline-none cursor-pointer transition-colors
          ${isLocked
            ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'border-gray-300 bg-white text-gray-700 hover:border-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'}
          ${isUpdating ? 'opacity-60' : ''}
        `}
      >
        {ORDER_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </option>
        ))}
      </select>
      <FiChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
      {isUpdating && (
        <div className="absolute -right-6 top-1/2 -translate-y-1/2">
          <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Desktop Table                                                      */
/* ------------------------------------------------------------------ */
const OrdersTable = ({ orders, expandedId, onToggleExpand, updatingId, onStatusChange }) => (
  <div className="hidden md:block overflow-x-auto">
    <table className="w-full text-left">
      <thead>
        <tr className="border-b border-gray-200 text-sm text-gray-500">
          <th className="pb-3 pr-4 font-medium">Order #</th>
          <th className="pb-3 pr-4 font-medium">Customer</th>
          <th className="pb-3 pr-4 font-medium">Date</th>
          <th className="pb-3 pr-4 font-medium">Items</th>
          <th className="pb-3 pr-4 font-medium">Total</th>
          <th className="pb-3 pr-4 font-medium">Payment</th>
          <th className="pb-3 pr-4 font-medium">Status</th>
          <th className="pb-3 font-medium">Actions</th>
        </tr>
      </thead>
      <tbody className="text-sm text-gray-700">
        {orders.map((order) => {
          const isExpanded = expandedId === order._id;
          return (
            <tr key={order._id} className="group">
              {/* Main Row */}
              <td className="py-3 pr-4 font-medium text-gray-900 border-b border-gray-100 group-last:border-0">
                {order.orderNumber}
              </td>
              <td className="py-3 pr-4 border-b border-gray-100 group-last:border-0">
                <div>
                  <p className="font-medium text-gray-900">{order.userId?.name ?? '—'}</p>
                  <p className="text-xs text-gray-400">{order.userId?.email ?? ''}</p>
                </div>
              </td>
              <td className="py-3 pr-4 border-b border-gray-100 group-last:border-0">
                {formatDate(order.createdAt)}
              </td>
              <td className="py-3 pr-4 border-b border-gray-100 group-last:border-0">
                {order.items?.length ?? 0}
              </td>
              <td className="py-3 pr-4 font-medium border-b border-gray-100 group-last:border-0">
                {formatCurrency(order.totalAmount)}
              </td>
              <td className="py-3 pr-4 border-b border-gray-100 group-last:border-0">
                <PaymentStatusBadge status={order.paymentStatus} />
              </td>
              <td className="py-3 pr-4 border-b border-gray-100 group-last:border-0">
                <OrderStatusBadge status={order.orderStatus} />
              </td>
              <td className="py-3 border-b border-gray-100 group-last:border-0">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onToggleExpand(order._id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    title={isExpanded ? 'Collapse' : 'Expand'}
                  >
                    {isExpanded ? (
                      <FiChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <FiChevronDown className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <StatusUpdateSelect
                    order={order}
                    updatingId={updatingId}
                    onStatusChange={onStatusChange}
                  />
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>

    {/* Expanded details rendered outside the table for cleaner layout */}
    {orders.map((order) =>
      expandedId === order._id ? (
        <div key={`detail-${order._id}`} className="mt-1 mb-4">
          <OrderDetails order={order} />
        </div>
      ) : null,
    )}
  </div>
);

/* ------------------------------------------------------------------ */
/*  Mobile Cards                                                       */
/* ------------------------------------------------------------------ */
const OrderCardList = ({ orders, expandedId, onToggleExpand, updatingId, onStatusChange }) => (
  <div className="md:hidden space-y-3">
    {orders.map((order) => {
      const isExpanded = expandedId === order._id;
      return (
        <div
          key={order._id}
          className="rounded-lg border border-gray-200 bg-white overflow-hidden"
        >
          {/* Card Header */}
          <div className="p-4 space-y-3">
            {/* Row 1 – Order # + Expand */}
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">{order.orderNumber}</span>
              <button
                onClick={() => onToggleExpand(order._id)}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {isExpanded ? 'Collapse' : 'Details'}
                {isExpanded ? (
                  <FiChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <FiChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
            </div>

            {/* Row 2 – Customer */}
            <div className="text-sm">
              <p className="font-medium text-gray-800">{order.userId?.name ?? '—'}</p>
              <p className="text-xs text-gray-400">{order.userId?.email ?? ''}</p>
            </div>

            {/* Row 3 – Amount + Date */}
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-gray-900">
                {formatCurrency(order.totalAmount)}
              </span>
              <span className="text-gray-400">{formatDate(order.createdAt)}</span>
            </div>

            {/* Row 4 – Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <OrderStatusBadge status={order.orderStatus} />
              <PaymentStatusBadge status={order.paymentStatus} />
              <span className="text-xs text-gray-400">
                {order.items?.length ?? 0} item{(order.items?.length ?? 0) !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Row 5 – Status Update */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Update status:</span>
              <StatusUpdateSelect
                order={order}
                updatingId={updatingId}
                onStatusChange={onStatusChange}
              />
            </div>
          </div>

          {/* Expanded Details */}
          {isExpanded && (
            <div className="border-t border-gray-200 p-4">
              <OrderDetails order={order} />
            </div>
          )}
        </div>
      );
    })}
  </div>
);

/* ------------------------------------------------------------------ */
/*  Pagination                                                         */
/* ------------------------------------------------------------------ */
const Pagination = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-3 pt-2">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <FiChevronLeft className="h-4 w-4" />
        Previous
      </button>

      <span className="text-sm text-gray-600">
        Page <span className="font-semibold text-gray-900">{page}</span> of{' '}
        <span className="font-semibold text-gray-900">{totalPages}</span>
      </span>

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Next
        <FiChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Empty State                                                        */
/* ------------------------------------------------------------------ */
const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <FiSearch className="h-14 w-14 text-gray-300 mb-4" />
    <h3 className="text-lg font-semibold text-gray-700">No orders found</h3>
    <p className="text-sm text-gray-500 mt-1 max-w-sm">
      No orders match the current filters. Try adjusting your filter criteria.
    </p>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedId, setExpandedId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  /* ---- Filter state ---- */
  const [orderStatusFilter, setOrderStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');

  /* ---- Fetch orders ---- */
  const fetchOrders = useCallback(
    async (pageNum = 1) => {
      setLoading(true);
      setExpandedId(null);

      try {
        const params = new URLSearchParams();
        params.append('page', pageNum);
        params.append('limit', PAGE_LIMIT);
        if (orderStatusFilter) params.append('orderStatus', orderStatusFilter);
        if (paymentStatusFilter) params.append('paymentStatus', paymentStatusFilter);

        const { data } = await api.get(`/admin/orders?${params.toString()}`);

        const items = data.data?.items ?? [];
        const pagination = data.meta?.pagination ?? {};

        setOrders(items);
        setPage(pagination.page || pageNum);
        setTotalPages(pagination.totalPages || 1);
      } catch (err) {
        const message =
          err.response?.data?.message || err.message || 'Failed to load orders';
        toast.error(message);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    },
    [orderStatusFilter, paymentStatusFilter],
  );

  /* ---- Initial fetch + refetch on filter change ---- */
  useEffect(() => {
    fetchOrders(1);
  }, [fetchOrders]);

  /* ---- Handle page change ---- */
  const handlePageChange = useCallback(
    (newPage) => {
      if (newPage < 1 || newPage > totalPages) return;
      fetchOrders(newPage);
    },
    [fetchOrders, totalPages],
  );

  /* ---- Toggle expand ---- */
  const handleToggleExpand = useCallback((id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  /* ---- Status update ---- */
  const handleStatusChange = useCallback(
    async (orderId, newStatus) => {
      setUpdatingId(orderId);
      try {
        const { data } = await api.patch(`/admin/orders/${orderId}/status`, {
          orderStatus: newStatus,
        });

        const updatedOrder = data.data;

        setOrders((prev) =>
          prev.map((o) =>
            o._id === orderId
              ? { ...o, orderStatus: updatedOrder?.orderStatus ?? newStatus }
              : o,
          ),
        );

        toast.success(`Order status updated to ${newStatus}`);
      } catch (err) {
        const message =
          err.response?.data?.message || err.message || 'Failed to update order status';
        toast.error(message);
      } finally {
        setUpdatingId(null);
      }
    },
    [],
  );

  /* ---- Filter change handlers (reset to page 1) ---- */
  const handleOrderStatusFilter = useCallback((value) => {
    setOrderStatusFilter(value);
    setPage(1);
  }, []);

  const handlePaymentStatusFilter = useCallback((value) => {
    setPaymentStatusFilter(value);
    setPage(1);
  }, []);

  /* ---- Loading skeleton ---- */
  if (loading) {
    return (
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Header skeleton */}
        <div>
          <div className="animate-pulse h-7 w-40 bg-gray-200 rounded" />
          <div className="animate-pulse h-4 w-64 bg-gray-200 rounded mt-2" />
        </div>

        <SkeletonFilters />

        <div className="bg-white rounded-xl shadow-sm p-6">
          <SkeletonTable />
          <SkeletonCards />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* ---- Header ---- */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage and track all customer orders.
        </p>
      </div>

      {/* ---- Filters ---- */}
      <FilterBar
        orderStatus={orderStatusFilter}
        paymentStatus={paymentStatusFilter}
        onOrderStatusChange={handleOrderStatusFilter}
        onPaymentStatusChange={handlePaymentStatusFilter}
      />

      {/* ---- Content ---- */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
        {orders.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <OrdersTable
              orders={orders}
              expandedId={expandedId}
              onToggleExpand={handleToggleExpand}
              updatingId={updatingId}
              onStatusChange={handleStatusChange}
            />
            <OrderCardList
              orders={orders}
              expandedId={expandedId}
              onToggleExpand={handleToggleExpand}
              updatingId={updatingId}
              onStatusChange={handleStatusChange}
            />

            {/* ---- Pagination ---- */}
            <div className="mt-6 border-t border-gray-100 pt-4">
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
