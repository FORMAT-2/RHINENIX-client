import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiShoppingBag,
  FiMinus,
  FiPlus,
  FiTrash2,
  FiTag,
  FiArrowRight,
  FiLogIn,
  FiLoader,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import SITE from '../config/site.constants';

/* ═══════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════ */
const fmt = (amt) =>
  `${SITE.CURRENCY}${Number(amt || 0).toLocaleString('en-IN')}`;

/** Extract normalised fields from a cart item regardless of whether
 *  productId is a populated object or a plain ObjectId string. */
const itemInfo = (item, slugCache) => {
  const pop =
    typeof item.productId === 'object' && item.productId !== null;
  const id = pop ? item.productId._id : item.productId;
  return {
    id,
    name: item.titleSnapshot || (pop ? item.productId.name : 'Product'),
    image: item.imageSnapshot || (pop ? item.productId.images?.[0] : ''),
    slug: pop ? item.productId.slug : slugCache.current?.[id],
    price: item.unitPriceSnapshot,
    maxQty: pop
      ? Math.min(item.productId.stockQty ?? 10, 10)
      : 10,
  };
};

/* ═══════════════════════════════════════════════════════════════════
   SKELETON (loading placeholder)
   ═══════════════════════════════════════════════════════════════════ */
const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse rounded-lg bg-gray-200 ${className}`} />
);

function CartSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Skeleton className="mb-6 h-8 w-52" />
      <div className="lg:grid lg:grid-cols-12 lg:gap-8">
        <div className="space-y-4 lg:col-span-7">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex gap-4 rounded-xl border border-gray-100 bg-white p-4"
            >
              <Skeleton className="h-16 w-16 shrink-0 !rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-8 w-24" />
              </div>
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </div>
        <div className="mt-6 lg:col-span-5 lg:mt-0">
          <div className="space-y-4 rounded-xl border border-gray-100 bg-white p-6">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-px w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   EMPTY CART
   ═══════════════════════════════════════════════════════════════════ */
function EmptyCart() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-20 text-center">
      <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-gray-100">
        <FiShoppingBag className="h-14 w-14 text-gray-400" />
      </div>
      <h2 className="mt-6 text-xl font-semibold text-gray-900">
        Your cart is empty
      </h2>
      <p className="mt-2 text-sm text-gray-500">
        Looks like you haven't added anything to your cart yet.
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-600"
      >
        Start Shopping
        <FiArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   CART ITEM
   ═══════════════════════════════════════════════════════════════════ */
function CartItem({ item, onUpdateQty, onRemove, busy, slugCache }) {
  const { id, name, image, slug, price, maxQty } = itemInfo(
    item,
    slugCache,
  );
  const lineTotal = price * item.quantity;

  const Wrap = slug ? Link : 'span';
  const wrapProps = slug ? { to: `/product/${slug}` } : {};

  return (
    <div className="flex gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-sm transition-shadow hover:shadow-md sm:gap-4 sm:p-4">
      {/* thumbnail */}
      <Wrap {...wrapProps} className="shrink-0">
        <img
          src={image || '/placeholder.png'}
          alt={name}
          className="h-16 w-16 rounded-lg bg-gray-50 object-cover sm:h-20 sm:w-20"
          loading="lazy"
        />
      </Wrap>

      {/* info */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Wrap
          {...wrapProps}
          className="line-clamp-2 text-sm font-medium text-gray-900 transition-colors hover:text-primary-500"
        >
          {name}
        </Wrap>

        <p className="mt-1 text-sm font-semibold text-gray-900">
          {fmt(price)}
        </p>

        {/* qty controls */}
        <div className="mt-2 flex items-center gap-3">
          <div className="inline-flex items-center rounded-lg border border-gray-200 bg-gray-50">
            <button
              onClick={() => onUpdateQty(id, item.quantity - 1)}
              disabled={busy || item.quantity <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-l-lg text-gray-600 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Decrease quantity"
            >
              <FiMinus className="h-3.5 w-3.5" />
            </button>
            <span className="flex h-8 w-8 items-center justify-center select-none text-sm font-medium text-gray-900">
              {busy ? (
                <FiLoader className="h-3.5 w-3.5 animate-spin text-primary-500" />
              ) : (
                item.quantity
              )}
            </span>
            <button
              onClick={() => onUpdateQty(id, item.quantity + 1)}
              disabled={busy || item.quantity >= maxQty}
              className="flex h-8 w-8 items-center justify-center rounded-r-lg text-gray-600 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Increase quantity"
            >
              <FiPlus className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            onClick={() => onRemove(id)}
            disabled={busy}
            className="flex items-center gap-1 text-xs font-medium text-red-500 transition-colors hover:text-red-700 disabled:opacity-40"
          >
            <FiTrash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Remove</span>
          </button>
        </div>
      </div>

      {/* line total */}
      <p className="shrink-0 text-right text-sm font-bold text-gray-900">
        {fmt(lineTotal)}
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ORDER SUMMARY
   ═══════════════════════════════════════════════════════════════════ */
function OrderSummary({
  cart,
  isAuthenticated,
  onCheckout,
  coupon,
  setCoupon,
  onApplyCoupon,
}) {
  const itemCount = cart.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-gray-900">Order Summary</h2>

      {/* price rows */}
      <div className="mt-4 space-y-3 text-sm">
        <Row
          label={`Subtotal (${itemCount} ${itemCount === 1 ? 'item' : 'items'})`}
          value={fmt(cart.subtotal)}
        />
        {cart.discountTotal > 0 && (
          <Row
            label="Discount"
            value={`-${fmt(cart.discountTotal)}`}
            valueClass="text-green-600"
          />
        )}
        <Row
          label="Shipping"
          value={
            cart.shippingEstimate > 0 ? (
              fmt(cart.shippingEstimate)
            ) : (
              <span className="font-medium text-green-600">FREE</span>
            )
          }
        />
        <div className="border-t border-gray-100 pt-3">
          <Row
            label="Total"
            value={fmt(cart.grandTotalEstimate)}
            bold
          />
        </div>
      </div>

      {/* coupon */}
      <div className="mt-5 flex items-center gap-2">
        <div className="relative flex-1">
          <FiTag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={coupon}
            onChange={(e) => setCoupon(e.target.value.toUpperCase())}
            placeholder="Coupon code"
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-sm placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
        <button
          onClick={onApplyCoupon}
          disabled={!coupon.trim()}
          className="rounded-lg border-2 border-primary-500 px-4 py-2 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Apply
        </button>
      </div>

      {/* CTA */}
      <div className="mt-5 space-y-3">
        {isAuthenticated ? (
          <button
            onClick={onCheckout}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-accent-600"
          >
            Proceed to Checkout
            <FiArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <Link
            to="/login"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-600"
          >
            <FiLogIn className="h-4 w-4" />
            Login to Checkout
          </Link>
        )}
        <Link
          to="/"
          className="block text-center text-sm font-medium text-primary-600 transition-colors hover:text-primary-700"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}

/** Simple flex-between row for price summary */
function Row({ label, value, bold, valueClass = '' }) {
  return (
    <div
      className={`flex justify-between ${bold ? 'text-base font-bold text-gray-900' : 'text-gray-600'}`}
    >
      <span>{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   CART PAGE (default export)
   ═══════════════════════════════════════════════════════════════════ */
export default function CartPage() {
  const navigate = useNavigate();
  const { cart, loading, updateItem, removeItem } = useCart();
  const { isAuthenticated } = useAuth();

  const [busyMap, setBusyMap] = useState({});
  const [coupon, setCoupon] = useState('');

  /* Keep a slug cache so product links survive un-populated cart
     mutations (updateItem / removeItem return un-populated data). */
  const slugCache = useRef({});

  useEffect(() => {
    cart?.items?.forEach((it) => {
      if (typeof it.productId === 'object' && it.productId?.slug) {
        slugCache.current[it.productId._id] = it.productId.slug;
      }
    });
  }, [cart]);

  /* ── actions ────────────────────────────────────────────────── */
  const handleQty = useCallback(
    async (productId, qty) => {
      if (qty < 1) return;
      setBusyMap((p) => ({ ...p, [productId]: true }));
      try {
        await updateItem(productId, qty);
      } catch (err) {
        toast.error(
          err.response?.data?.message || 'Failed to update quantity',
        );
      } finally {
        setBusyMap((p) => ({ ...p, [productId]: false }));
      }
    },
    [updateItem],
  );

  const handleRemove = useCallback(
    async (productId) => {
      setBusyMap((p) => ({ ...p, [productId]: true }));
      try {
        await removeItem(productId);
        toast.success('Item removed from cart');
      } catch (err) {
        toast.error(
          err.response?.data?.message || 'Failed to remove item',
        );
      } finally {
        setBusyMap((p) => ({ ...p, [productId]: false }));
      }
    },
    [removeItem],
  );

  const handleApplyCoupon = () =>
    toast('Coupon feature coming soon!', { icon: '🏷️' });

  const handleCheckout = () => navigate('/checkout');

  /* ── render ─────────────────────────────────────────────────── */
  if (loading) return <CartSkeleton />;
  if (!cart || !cart.items?.length) return <EmptyCart />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 pb-32 lg:pb-6">
      {/* heading */}
      <h1 className="mb-6 text-xl font-bold text-gray-900 sm:text-2xl">
        Shopping Cart
        <span className="ml-2 text-base font-normal text-gray-500">
          ({cart.items.length}{' '}
          {cart.items.length === 1 ? 'item' : 'items'})
        </span>
      </h1>

      <div className="lg:grid lg:grid-cols-12 lg:gap-8">
        {/* items */}
        <div className="space-y-3 lg:col-span-7">
          {cart.items.map((item) => {
            const id =
              typeof item.productId === 'object'
                ? item.productId._id
                : item.productId;
            return (
              <CartItem
                key={id}
                item={item}
                onUpdateQty={handleQty}
                onRemove={handleRemove}
                busy={!!busyMap[id]}
                slugCache={slugCache}
              />
            );
          })}
        </div>

        {/* desktop sidebar */}
        <div className="hidden lg:col-span-5 lg:block">
          <div className="sticky top-24">
            <OrderSummary
              cart={cart}
              isAuthenticated={isAuthenticated}
              onCheckout={handleCheckout}
              coupon={coupon}
              setCoupon={setCoupon}
              onApplyCoupon={handleApplyCoupon}
            />
          </div>
        </div>
      </div>

      {/* mobile sticky bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white p-4 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div>
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-lg font-bold text-gray-900">
              {fmt(cart.grandTotalEstimate)}
            </p>
          </div>
          {isAuthenticated ? (
            <button
              onClick={handleCheckout}
              className="flex items-center gap-2 rounded-lg bg-accent-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-accent-600"
            >
              Checkout
              <FiArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-2 rounded-lg bg-primary-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-600"
            >
              <FiLogIn className="h-4 w-4" />
              Login
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
