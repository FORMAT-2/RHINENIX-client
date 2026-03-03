import { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft,
  FiCheck,
  FiPackage,
  FiTruck,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiLoader,
  FiMapPin,
  FiAlertTriangle,
  FiExternalLink,
  FiStar,
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

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const TIMELINE_STEPS = [
  { key: 'placed',           label: 'Placed',           icon: FiClock },
  { key: 'confirmed',        label: 'Confirmed',        icon: FiCheckCircle },
  { key: 'packed',           label: 'Packed',           icon: FiPackage },
  { key: 'shipped',          label: 'Shipped',          icon: FiTruck },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: FiTruck },
  { key: 'delivered',        label: 'Delivered',        icon: FiCheckCircle },
];

const STATUS_ORDER = ['placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered'];

function getStepState(stepKey, currentStatus) {
  if (currentStatus === 'cancelled' || currentStatus === 'returned') {
    return 'disabled';
  }
  const currentIdx = STATUS_ORDER.indexOf(currentStatus);
  const stepIdx = STATUS_ORDER.indexOf(stepKey);
  if (stepIdx < currentIdx) return 'completed';
  if (stepIdx === currentIdx) return 'current';
  return 'upcoming';
}

/* ═══════════════════════════════════════════════════════════════════
   SKELETON
   ═══════════════════════════════════════════════════════════════════ */
const Sk = ({ className = '' }) => (
  <div className={`animate-pulse rounded-lg bg-gray-200 ${className}`} />
);

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6 flex items-center gap-3">
        <Sk className="h-10 w-10 !rounded-lg" />
        <Sk className="h-7 w-56" />
      </div>
      <Sk className="mb-6 h-40 w-full" />
      <Sk className="mb-4 h-24 w-full" />
      <Sk className="mb-4 h-32 w-full" />
      <Sk className="h-24 w-full" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TIMELINE
   ═══════════════════════════════════════════════════════════════════ */
function OrderTimeline({ status }) {
  const isCancelled = status === 'cancelled' || status === 'returned';

  if (isCancelled) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
            <FiXCircle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-red-800">
              Order {status === 'cancelled' ? 'Cancelled' : 'Returned'}
            </p>
            <p className="text-xs text-red-600">
              {status === 'cancelled'
                ? 'This order has been cancelled. If you paid, a refund will be initiated.'
                : 'This order has been returned.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-gray-900">Order Status</h3>
      <div className="relative">
        {TIMELINE_STEPS.map((step, i) => {
          const state = getStepState(step.key, status);
          const Icon = step.icon;
          const isLast = i === TIMELINE_STEPS.length - 1;

          return (
            <div key={step.key} className="flex gap-3">
              {/* Dot + line */}
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    state === 'completed'
                      ? 'bg-green-500 text-white'
                      : state === 'current'
                        ? 'bg-primary-500 text-white ring-4 ring-primary-100'
                        : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {state === 'completed' ? (
                    <FiCheck className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
                {!isLast && (
                  <div
                    className={`my-1 h-6 w-0.5 ${
                      state === 'completed' ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>

              {/* Label */}
              <div className={`pb-4 ${isLast ? 'pb-0' : ''}`}>
                <p
                  className={`text-sm font-medium ${
                    state === 'completed'
                      ? 'text-green-700'
                      : state === 'current'
                        ? 'text-primary-700'
                        : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ITEM CARD
   ═══════════════════════════════════════════════════════════════════ */
function OrderItemCard({ item }) {
  return (
    <div className="flex gap-3 py-3 first:pt-0 last:pb-0">
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
        {item.image ? (
          <img src={item.image} alt={item.name} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <FiPackage className="h-6 w-6 text-gray-300" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900 line-clamp-1">
          {item.name}
        </p>
        <p className="mt-0.5 text-xs text-gray-500">
          Qty: {item.qty} × {fmt(item.unitPrice)}
        </p>
      </div>
      <p className="shrink-0 text-sm font-semibold text-gray-900">
        {fmt(item.qty * item.unitPrice)}
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PRICE ROW
   ═══════════════════════════════════════════════════════════════════ */
function PriceRow({ label, value, bold, valueClass = '' }) {
  return (
    <div
      className={`flex justify-between ${bold ? 'text-base font-bold text-gray-900' : 'text-sm text-gray-600'}`}
    >
      <span>{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   CONFIRM DIALOG
   ═══════════════════════════════════════════════════════════════════ */
function ConfirmCancelDialog({ onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
            <FiAlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Cancel Order</h3>
        </div>
        <p className="mb-5 text-sm text-gray-600">
          Are you sure you want to cancel this order? This action cannot be undone. If you've already paid, a refund will be initiated.
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
          >
            {loading && <FiLoader className="h-4 w-4 animate-spin" />}
            Yes, Cancel Order
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
          >
            Keep Order
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ORDER DETAIL PAGE
   ═══════════════════════════════════════════════════════════════════ */
export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { loading: authLoading, isAuthenticated } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [tracking, setTracking] = useState(null);
  const [trackLoading, setTrackLoading] = useState(false);

  /* Redirect unauthenticated */
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login', { replace: true, state: { from: { pathname: `/orders/${id}` } } });
    }
  }, [authLoading, isAuthenticated, navigate, id]);

  /* Fetch order */
  useEffect(() => {
    if (!isAuthenticated || !id) return;
    setLoading(true);
    setError(null);
    api
      .get(`/orders/${id}`)
      .then(({ data }) => setOrder(data.data))
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to load order details');
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated, id]);

  /* Cancel order */
  const handleCancel = useCallback(async () => {
    setCancelling(true);
    try {
      const { data } = await api.patch(`/orders/${id}/cancel`);
      setOrder(data.data);
      setShowCancel(false);
      toast.success('Order cancelled successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  }, [id]);

  /* Track shipment */
  const handleTrack = useCallback(async () => {
    setTrackLoading(true);
    try {
      const { data } = await api.get(`/shipping/shipments/${id}/track`);
      setTracking(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Tracking not available yet');
    } finally {
      setTrackLoading(false);
    }
  }, [id]);

  /* ── Loading / guard ────────────────────────────────────────── */
  if (authLoading || !isAuthenticated || loading) return <DetailSkeleton />;

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <FiXCircle className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-gray-900">Order not found</h2>
        <p className="mt-1 text-sm text-gray-500">{error}</p>
        <Link
          to="/orders"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-600"
        >
          <FiArrowLeft className="h-4 w-4" />
          Back to Orders
        </Link>
      </div>
    );
  }

  if (!order) return null;

  const isCancellable = ['placed', 'confirmed'].includes(order.orderStatus);
  const isShipped = ['shipped', 'out_for_delivery'].includes(order.orderStatus);
  const isDelivered = order.orderStatus === 'delivered';
  const pricing = order.pricing || {};
  const addr = order.addressSnapshot || {};

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 pb-24 lg:pb-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          to="/orders"
          className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
        >
          <FiArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-gray-900 sm:text-xl">
            Order #{order.orderNumber}
          </h1>
          <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* ── Timeline ──────────────────────────────────────────── */}
        <OrderTimeline status={order.orderStatus} />

        {/* ── Items ─────────────────────────────────────────────── */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">
            Items ({order.items?.length || 0})
          </h3>
          <div className="divide-y divide-gray-50">
            {(order.items || []).map((item, i) => (
              <OrderItemCard key={i} item={item} />
            ))}
          </div>
        </div>

        {/* ── Price Breakdown ───────────────────────────────────── */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Price Breakdown</h3>
          <div className="space-y-2">
            <PriceRow label="Subtotal" value={fmt(pricing.subtotal)} />
            {pricing.discountTotal > 0 && (
              <PriceRow
                label="Discount"
                value={`-${fmt(pricing.discountTotal)}`}
                valueClass="text-green-600"
              />
            )}
            <PriceRow
              label="Shipping"
              value={
                pricing.shippingCharge > 0
                  ? fmt(pricing.shippingCharge)
                  : 'FREE'
              }
              valueClass={pricing.shippingCharge > 0 ? '' : 'text-green-600 font-medium'}
            />
            {pricing.taxTotal > 0 && (
              <PriceRow label="Tax" value={fmt(pricing.taxTotal)} />
            )}
            <div className="border-t border-gray-100 pt-2">
              <PriceRow label="Grand Total" value={fmt(pricing.grandTotal)} bold />
            </div>
          </div>
        </div>

        {/* ── Delivery Address ──────────────────────────────────── */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
            <FiMapPin className="h-4 w-4 text-gray-500" />
            Delivery Address
          </h3>
          <div className="text-sm text-gray-600">
            <p className="font-medium text-gray-900">{addr.fullName}</p>
            <p className="mt-1 leading-relaxed">
              {addr.line1}
              {addr.line2 ? `, ${addr.line2}` : ''}
              {addr.landmark ? ` (${addr.landmark})` : ''}
              <br />
              {addr.city}, {addr.state} – {addr.pincode}
            </p>
            {addr.phone && (
              <p className="mt-1 text-xs text-gray-500">Phone: {addr.phone}</p>
            )}
          </div>
        </div>

        {/* ── Tracking Info (if fetched) ────────────────────────── */}
        {tracking && (
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
            <h3 className="mb-2 text-sm font-semibold text-blue-900">Shipment Tracking</h3>
            {tracking.trackingUrl ? (
              <a
                href={tracking.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:underline"
              >
                Track on Carrier Website <FiExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : (
              <p className="text-sm text-blue-800">
                {tracking.status || 'Tracking information will be updated shortly.'}
              </p>
            )}
            {tracking.awb && (
              <p className="mt-1 text-xs text-blue-700">AWB: {tracking.awb}</p>
            )}
          </div>
        )}

        {/* ── Actions ───────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3">
          {isCancellable && (
            <button
              type="button"
              onClick={() => setShowCancel(true)}
              className="inline-flex items-center gap-2 rounded-lg border-2 border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              <FiXCircle className="h-4 w-4" />
              Cancel Order
            </button>
          )}

          {isShipped && (
            <button
              type="button"
              onClick={handleTrack}
              disabled={trackLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-600 disabled:opacity-60"
            >
              {trackLoading ? (
                <FiLoader className="h-4 w-4 animate-spin" />
              ) : (
                <FiTruck className="h-4 w-4" />
              )}
              Track Shipment
            </button>
          )}

          {isDelivered && (
            <button
              type="button"
              onClick={() => toast('Review feature coming soon!', { icon: '⭐' })}
              className="inline-flex items-center gap-2 rounded-lg border-2 border-primary-200 px-4 py-2.5 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-50"
            >
              <FiStar className="h-4 w-4" />
              Write a Review
            </button>
          )}
        </div>
      </div>

      {/* ── Cancel Confirmation ─────────────────────────────────── */}
      {showCancel && (
        <ConfirmCancelDialog
          onConfirm={handleCancel}
          onCancel={() => setShowCancel(false)}
          loading={cancelling}
        />
      )}
    </div>
  );
}
