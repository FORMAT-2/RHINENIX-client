import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiMapPin,
  FiCheck,
  FiPlus,
  FiLoader,
  FiHome,
  FiBriefcase,
  FiPackage,
  FiArrowLeft,
  FiArrowRight,
  FiCheckCircle,
  FiEdit3,
  FiShoppingBag,
  FiAlertCircle,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import SITE from '../config/site.constants';

/* ═══════════════════════════════════════════════════════════════════
   CONSTANTS & HELPERS
   ═══════════════════════════════════════════════════════════════════ */
const fmt = (amt) =>
  `${SITE.CURRENCY}${Number(amt || 0).toLocaleString('en-IN')}`;

const STEPS = [
  { num: 1, label: 'Address' },
  { num: 2, label: 'Review' },
  { num: 3, label: 'Payment' },
];

const TYPE_ICONS = {
  home: FiHome,
  work: FiBriefcase,
  other: FiMapPin,
};

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar',
  'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh',
  'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra',
  'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi',
  'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

const EMPTY_FORM = {
  fullName: '',
  phone: '',
  line1: '',
  line2: '',
  landmark: '',
  city: '',
  state: '',
  pincode: '',
  addressType: 'home',
  isDefault: false,
};

/* ── Razorpay loader ─────────────────────────────────────────── */
const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

/* ═══════════════════════════════════════════════════════════════════
   SKELETON
   ═══════════════════════════════════════════════════════════════════ */
const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse rounded-lg bg-gray-200 ${className}`} />
);

function CheckoutSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Skeleton className="mx-auto mb-8 h-10 w-64" />
      <div className="lg:grid lg:grid-cols-12 lg:gap-8">
        <div className="space-y-4 lg:col-span-7">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <div className="mt-6 lg:col-span-5 lg:mt-0">
          <Skeleton className="h-72 w-full" />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PROGRESS BAR
   ═══════════════════════════════════════════════════════════════════ */
function ProgressBar({ current }) {
  return (
    <div className="mb-8 flex items-center justify-center">
      {STEPS.map((s, i) => {
        const done = current > s.num;
        const active = current === s.num;
        return (
          <div key={s.num} className="flex items-center">
            {/* circle */}
            <div className="flex flex-col items-center">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors ${
                  done
                    ? 'border-primary-500 bg-primary-500 text-white'
                    : active
                      ? 'border-primary-500 bg-white text-primary-500'
                      : 'border-gray-300 bg-white text-gray-400'
                }`}
              >
                {done ? <FiCheck className="h-4 w-4" /> : s.num}
              </div>
              <span
                className={`mt-1.5 text-xs font-medium ${
                  done || active ? 'text-primary-600' : 'text-gray-400'
                }`}
              >
                {s.label}
              </span>
            </div>
            {/* connector */}
            {i < STEPS.length - 1 && (
              <div
                className={`mx-2 mb-5 h-0.5 w-10 sm:w-16 ${
                  done ? 'bg-primary-500' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ADDRESS CARD
   ═══════════════════════════════════════════════════════════════════ */
function AddressCard({ addr, selected, onSelect, compact }) {
  const Icon = TYPE_ICONS[addr.addressType] || FiMapPin;
  return (
    <button
      type="button"
      onClick={() => onSelect?.(addr._id)}
      className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
        selected
          ? 'border-primary-500 bg-primary-50/50 ring-1 ring-primary-200'
          : 'border-gray-200 bg-white hover:border-gray-300'
      } ${compact ? 'p-3' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">
              {addr.fullName}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-gray-600">
              <Icon className="h-3 w-3" />
              {addr.addressType}
            </span>
            {addr.isDefault && (
              <span className="rounded-md bg-primary-100 px-2 py-0.5 text-[11px] font-medium text-primary-700">
                Default
              </span>
            )}
          </div>
          <p className="mt-1 text-sm leading-relaxed text-gray-600">
            {addr.line1}
            {addr.line2 ? `, ${addr.line2}` : ''}
            {addr.landmark ? ` (${addr.landmark})` : ''}
            <br />
            {addr.city}, {addr.state} – {addr.pincode}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Phone: {addr.phone}
          </p>
        </div>
        {/* radio indicator */}
        {onSelect && (
          <div
            className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
              selected
                ? 'border-primary-500 bg-primary-500'
                : 'border-gray-300'
            }`}
          >
            {selected && (
              <div className="h-2 w-2 rounded-full bg-white" />
            )}
          </div>
        )}
      </div>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ADDRESS FORM
   ═══════════════════════════════════════════════════════════════════ */
function AddressForm({ onSaved, onCancel }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (field) => (e) => {
    const val =
      e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((p) => ({ ...p, [field]: val }));
    setErrors((p) => ({ ...p, [field]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    if (!/^\d{10}$/.test(form.phone.replace(/\s/g, '')))
      e.phone = 'Enter a valid 10-digit phone number';
    if (!form.line1.trim()) e.line1 = 'Address line 1 is required';
    if (!form.city.trim()) e.city = 'City is required';
    if (!form.state) e.state = 'State is required';
    if (!/^\d{6}$/.test(form.pincode.trim()))
      e.pincode = 'Enter a valid 6-digit pincode';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { ...form, phone: form.phone.replace(/\s/g, '') };
      const { data } = await api.post('/users/me/addresses', payload);
      toast.success('Address saved');
      onSaved(data.data);
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Failed to save address',
      );
    } finally {
      setSaving(false);
    }
  };

  const inputCls = (field) =>
    `w-full rounded-lg border bg-white px-3 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 ${
      errors[field]
        ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
        : 'border-gray-200 focus:border-primary-500 focus:ring-primary-200'
    }`;

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6"
    >
      <h3 className="mb-4 text-base font-semibold text-gray-900">
        Add New Address
      </h3>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* full name */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Full Name *
          </label>
          <input
            type="text"
            value={form.fullName}
            onChange={set('fullName')}
            placeholder="John Doe"
            className={inputCls('fullName')}
          />
          {errors.fullName && (
            <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>
          )}
        </div>

        {/* phone */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Phone *
          </label>
          <input
            type="tel"
            value={form.phone}
            onChange={set('phone')}
            placeholder="9876543210"
            maxLength={10}
            className={inputCls('phone')}
          />
          {errors.phone && (
            <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
          )}
        </div>

        {/* line 1 */}
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Address Line 1 *
          </label>
          <input
            type="text"
            value={form.line1}
            onChange={set('line1')}
            placeholder="House No., Building, Street"
            className={inputCls('line1')}
          />
          {errors.line1 && (
            <p className="mt-1 text-xs text-red-500">{errors.line1}</p>
          )}
        </div>

        {/* line 2 */}
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Address Line 2
          </label>
          <input
            type="text"
            value={form.line2}
            onChange={set('line2')}
            placeholder="Area, Colony (optional)"
            className={inputCls('line2')}
          />
        </div>

        {/* landmark */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Landmark
          </label>
          <input
            type="text"
            value={form.landmark}
            onChange={set('landmark')}
            placeholder="Near… (optional)"
            className={inputCls('landmark')}
          />
        </div>

        {/* city */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            City *
          </label>
          <input
            type="text"
            value={form.city}
            onChange={set('city')}
            placeholder="City"
            className={inputCls('city')}
          />
          {errors.city && (
            <p className="mt-1 text-xs text-red-500">{errors.city}</p>
          )}
        </div>

        {/* state */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            State *
          </label>
          <select
            value={form.state}
            onChange={set('state')}
            className={inputCls('state')}
          >
            <option value="">Select state</option>
            {INDIAN_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {errors.state && (
            <p className="mt-1 text-xs text-red-500">{errors.state}</p>
          )}
        </div>

        {/* pincode */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Pincode *
          </label>
          <input
            type="text"
            value={form.pincode}
            onChange={set('pincode')}
            placeholder="110001"
            maxLength={6}
            className={inputCls('pincode')}
          />
          {errors.pincode && (
            <p className="mt-1 text-xs text-red-500">{errors.pincode}</p>
          )}
        </div>
      </div>

      {/* type selector */}
      <div className="mt-4">
        <label className="mb-2 block text-xs font-medium text-gray-700">
          Address Type
        </label>
        <div className="flex gap-2">
          {['home', 'work', 'other'].map((t) => {
            const Icon = TYPE_ICONS[t];
            const active = form.addressType === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() =>
                  setForm((p) => ({ ...p, addressType: t }))
                }
                className={`inline-flex items-center gap-1.5 rounded-lg border-2 px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                  active
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {t}
              </button>
            );
          })}
        </div>
      </div>

      {/* default checkbox */}
      <label className="mt-4 flex items-center gap-2">
        <input
          type="checkbox"
          checked={form.isDefault}
          onChange={set('isDefault')}
          className="h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
        />
        <span className="text-sm text-gray-700">
          Set as default address
        </span>
      </label>

      {/* actions */}
      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-600 disabled:opacity-60"
        >
          {saving && (
            <FiLoader className="h-4 w-4 animate-spin" />
          )}
          Save Address
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   STEP 1  –  ADDRESS SELECTION
   ═══════════════════════════════════════════════════════════════════ */
function AddressStep({
  addresses,
  loadingAddr,
  selectedId,
  onSelect,
  onContinue,
  onAddressSaved,
}) {
  const [showForm, setShowForm] = useState(false);

  const handleSaved = (addr) => {
    setShowForm(false);
    onAddressSaved(addr);
  };

  if (loadingAddr) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-gray-900">
        Select Delivery Address
      </h2>

      {addresses.length === 0 && !showForm && (
        <div className="rounded-xl border-2 border-dashed border-gray-300 p-8 text-center">
          <FiMapPin className="mx-auto h-10 w-10 text-gray-400" />
          <p className="mt-3 text-sm text-gray-600">
            No saved addresses. Add one to continue.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {addresses.map((a) => (
          <AddressCard
            key={a._id}
            addr={a}
            selected={selectedId === a._id}
            onSelect={onSelect}
          />
        ))}
      </div>

      {/* add new toggle */}
      {showForm ? (
        <div className="mt-4">
          <AddressForm
            onSaved={handleSaved}
            onCancel={() => setShowForm(false)}
          />
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:border-primary-400 hover:text-primary-600"
        >
          <FiPlus className="h-4 w-4" />
          Add New Address
        </button>
      )}

      {/* continue */}
      <div className="mt-6">
        <button
          onClick={onContinue}
          disabled={!selectedId}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
        >
          Continue
          <FiArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   STEP 2  –  REVIEW ORDER
   ═══════════════════════════════════════════════════════════════════ */
function ReviewStep({
  cart,
  selectedAddr,
  onBack,
  onPlaceOrder,
  placing,
}) {
  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-gray-900">
        Review Your Order
      </h2>

      {/* address summary */}
      {selectedAddr && (
        <div className="mb-5 rounded-xl border border-gray-200 bg-gray-50/50 p-4">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Delivering to
            </span>
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
            >
              <FiEdit3 className="h-3 w-3" />
              Change
            </button>
          </div>
          <p className="text-sm font-medium text-gray-900">
            {selectedAddr.fullName}
          </p>
          <p className="mt-0.5 text-sm text-gray-600">
            {selectedAddr.line1}
            {selectedAddr.line2 ? `, ${selectedAddr.line2}` : ''},{' '}
            {selectedAddr.city}, {selectedAddr.state} –{' '}
            {selectedAddr.pincode}
          </p>
          <p className="mt-0.5 text-xs text-gray-500">
            Phone: {selectedAddr.phone}
          </p>
        </div>
      )}

      {/* items */}
      <div className="space-y-3">
        {cart.items.map((item) => {
          const pop =
            typeof item.productId === 'object' &&
            item.productId !== null;
          const id = pop ? item.productId._id : item.productId;
          const name =
            item.titleSnapshot || (pop ? item.productId.name : 'Product');
          const image =
            item.imageSnapshot ||
            (pop ? item.productId.images?.[0] : '');
          const price = item.unitPriceSnapshot;

          return (
            <div
              key={id}
              className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white p-3"
            >
              <img
                src={image || '/placeholder.png'}
                alt={name}
                className="h-12 w-12 rounded-lg bg-gray-50 object-cover"
                loading="lazy"
              />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm font-medium text-gray-900">
                  {name}
                </p>
                <p className="text-xs text-gray-500">
                  Qty: {item.quantity}
                </p>
              </div>
              <p className="shrink-0 text-sm font-semibold text-gray-900">
                {fmt(price * item.quantity)}
              </p>
            </div>
          );
        })}
      </div>

      {/* price breakdown */}
      <div className="mt-5 rounded-xl border border-gray-100 bg-white p-4">
        <div className="space-y-2 text-sm">
          <PriceRow label="Subtotal" value={fmt(cart.subtotal)} />
          {cart.discountTotal > 0 && (
            <PriceRow
              label="Discount"
              value={`-${fmt(cart.discountTotal)}`}
              valueClass="text-green-600"
            />
          )}
          <PriceRow
            label="Shipping"
            value={
              cart.shippingEstimate > 0 ? (
                fmt(cart.shippingEstimate)
              ) : (
                <span className="font-medium text-green-600">FREE</span>
              )
            }
          />
          <div className="border-t border-gray-100 pt-2">
            <PriceRow
              label="Total"
              value={fmt(cart.grandTotalEstimate)}
              bold
            />
          </div>
        </div>
      </div>

      {/* actions */}
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
        <button
          onClick={onBack}
          className="flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
        >
          <FiArrowLeft className="h-4 w-4" />
          Back
        </button>
        <button
          onClick={onPlaceOrder}
          disabled={placing}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-accent-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-accent-600 disabled:opacity-60 sm:flex-initial"
        >
          {placing ? (
            <FiLoader className="h-4 w-4 animate-spin" />
          ) : (
            <FiPackage className="h-4 w-4" />
          )}
          {placing ? 'Processing…' : 'Place Order & Pay'}
        </button>
      </div>

      <Link
        to="/cart"
        className="mt-4 block text-center text-sm font-medium text-primary-600 hover:text-primary-700"
      >
        Edit Cart
      </Link>
    </div>
  );
}

function PriceRow({ label, value, bold, valueClass = '' }) {
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
   ORDER SUCCESS SCREEN
   ═══════════════════════════════════════════════════════════════════ */
function OrderSuccess({ orderResult }) {
  return (
    <div className="mx-auto max-w-lg py-12 text-center">
      {/* animated checkmark */}
      <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-100">
        <FiCheckCircle className="h-14 w-14 text-green-500 animate-[bounceIn_0.5s_ease-out]" />
      </div>

      <h2 className="mt-6 text-2xl font-bold text-gray-900">
        Order Placed Successfully!
      </h2>
      <p className="mt-2 text-gray-600">
        Thank you for your order. We'll notify you when it ships.
      </p>

      {orderResult?.orderNumber && (
        <div className="mt-4 inline-block rounded-lg bg-gray-100 px-4 py-2">
          <span className="text-xs text-gray-500">Order Number</span>
          <p className="text-sm font-bold text-gray-900">
            {orderResult.orderNumber}
          </p>
        </div>
      )}

      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        {orderResult?.orderId && (
          <Link
            to={`/orders/${orderResult.orderId}`}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-600"
          >
            <FiPackage className="h-4 w-4" />
            View Order
          </Link>
        )}
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-lg border-2 border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
        >
          <FiShoppingBag className="h-4 w-4" />
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   DESKTOP ORDER SIDEBAR
   ═══════════════════════════════════════════════════════════════════ */
function OrderSidebar({ cart }) {
  const itemCount = cart.items.reduce((s, i) => s + i.quantity, 0);
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-gray-900">
        Order Summary
      </h3>

      {/* compact items */}
      <div className="mt-4 max-h-52 space-y-2.5 overflow-y-auto pr-1">
        {cart.items.map((item) => {
          const pop =
            typeof item.productId === 'object' &&
            item.productId !== null;
          const id = pop ? item.productId._id : item.productId;
          const name =
            item.titleSnapshot || (pop ? item.productId.name : 'Product');
          const image =
            item.imageSnapshot ||
            (pop ? item.productId.images?.[0] : '');

          return (
            <div key={id} className="flex items-center gap-2.5">
              <img
                src={image || '/placeholder.png'}
                alt={name}
                className="h-10 w-10 rounded-md bg-gray-50 object-cover"
                loading="lazy"
              />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-xs font-medium text-gray-800">
                  {name}
                </p>
                <p className="text-[11px] text-gray-500">
                  Qty: {item.quantity}
                </p>
              </div>
              <p className="shrink-0 text-xs font-semibold text-gray-900">
                {fmt(item.unitPriceSnapshot * item.quantity)}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-4 border-t border-gray-100 pt-4 text-sm">
        <PriceRow
          label={`Subtotal (${itemCount} items)`}
          value={fmt(cart.subtotal)}
        />
        {cart.discountTotal > 0 && (
          <PriceRow
            label="Discount"
            value={`-${fmt(cart.discountTotal)}`}
            valueClass="text-green-600"
          />
        )}
        <PriceRow
          label="Shipping"
          value={
            cart.shippingEstimate > 0 ? (
              fmt(cart.shippingEstimate)
            ) : (
              <span className="font-medium text-green-600">FREE</span>
            )
          }
        />
        <div className="mt-2 border-t border-gray-100 pt-2">
          <PriceRow
            label="Total"
            value={fmt(cart.grandTotalEstimate)}
            bold
          />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   CHECKOUT PAGE (default export)
   ═══════════════════════════════════════════════════════════════════ */
export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, loading: cartLoading, fetchCart } = useCart();
  const { user, isAuthenticated } = useAuth();

  const [step, setStep] = useState(1);
  const [addresses, setAddresses] = useState([]);
  const [loadingAddr, setLoadingAddr] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [placing, setPlacing] = useState(false);
  const [orderResult, setOrderResult] = useState(null);

  /* ── redirect guards ────────────────────────────────────────── */
  useEffect(() => {
    if (!cartLoading && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [cartLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (!cartLoading && isAuthenticated && (!cart || !cart.items?.length) && !orderResult) {
      navigate('/cart', { replace: true });
    }
  }, [cartLoading, isAuthenticated, cart, orderResult, navigate]);

  /* ── fetch addresses ────────────────────────────────────────── */
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/users/me/addresses');
        if (cancelled) return;
        const list = data.data || [];
        setAddresses(list);
        // auto-select default or first
        const def = list.find((a) => a.isDefault) || list[0];
        if (def) setSelectedId(def._id);
      } catch {
        if (!cancelled) toast.error('Failed to load addresses');
      } finally {
        if (!cancelled) setLoadingAddr(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  /* ── derived ────────────────────────────────────────────────── */
  const selectedAddr = addresses.find((a) => a._id === selectedId);

  /* ── address saved handler ──────────────────────────────────── */
  const handleAddressSaved = useCallback((addr) => {
    setAddresses((prev) => {
      // If new address is default, unset others
      const updated = addr.isDefault
        ? prev.map((a) => ({ ...a, isDefault: false }))
        : prev;
      return [addr, ...updated];
    });
    setSelectedId(addr._id);
  }, []);

  /* ── place order (Razorpay) ─────────────────────────────────── */
  const handlePlaceOrder = useCallback(async () => {
    if (!selectedId) return;
    setPlacing(true);

    try {
      // 1. Load Razorpay SDK
      const loaded = await loadRazorpay();
      if (!loaded) {
        toast.error(
          'Failed to load payment gateway. Please check your connection.',
        );
        setPlacing(false);
        return;
      }

      // 2. Create Razorpay order on our server
      const { data } = await api.post('/payments/razorpay/order', {
        addressId: selectedId,
      });
      const rp = data.data;

      // 3. Open Razorpay checkout popup
      const options = {
        key: rp.keyId,
        amount: rp.amount,
        currency: rp.currency,
        name: SITE.NAME,
        description: 'Order Payment',
        order_id: rp.razorpayOrderId,
        handler: async (response) => {
          // 4. Verify on our server
          setStep(3);
          try {
            const verify = await api.post(
              '/payments/razorpay/verify',
              {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              },
            );
            setOrderResult(verify.data.data);
            // Refresh cart so it becomes empty
            fetchCart();
          } catch {
            toast.error(
              'Payment verification failed. If amount was deducted, please contact support.',
            );
            setStep(2);
            setPlacing(false);
          }
        },
        prefill: {
          name: rp.customer?.name || user?.name || '',
          email: rp.customer?.email || user?.email || '',
          contact: rp.customer?.phone || '',
        },
        theme: { color: SITE.COLORS.primary },
        modal: {
          ondismiss: () => {
            setPlacing(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (resp) => {
        toast.error(
          resp.error?.description || 'Payment failed. Please try again.',
        );
        setPlacing(false);
      });
      rzp.open();
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Failed to initiate payment',
      );
      setPlacing(false);
    }
  }, [selectedId, user, fetchCart]);

  /* ── render ─────────────────────────────────────────────────── */
  if (cartLoading) return <CheckoutSkeleton />;

  // Success screen (replaces the entire checkout)
  if (orderResult) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6">
        <ProgressBar current={4} />
        <OrderSuccess orderResult={orderResult} />
      </div>
    );
  }

  // Payment processing (step 3, waiting for verification)
  if (step === 3 && !orderResult) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6">
        <ProgressBar current={3} />
        <div className="py-20 text-center">
          <FiLoader className="mx-auto h-12 w-12 animate-spin text-primary-500" />
          <p className="mt-4 text-lg font-medium text-gray-700">
            Verifying your payment…
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Please don't close this page.
          </p>
        </div>
      </div>
    );
  }

  if (!cart || !cart.items?.length) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <ProgressBar current={step} />

      <div className="lg:grid lg:grid-cols-12 lg:gap-8">
        {/* main content */}
        <div className="lg:col-span-7">
          {step === 1 && (
            <AddressStep
              addresses={addresses}
              loadingAddr={loadingAddr}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onContinue={() => setStep(2)}
              onAddressSaved={handleAddressSaved}
            />
          )}
          {step === 2 && (
            <ReviewStep
              cart={cart}
              selectedAddr={selectedAddr}
              onBack={() => setStep(1)}
              onPlaceOrder={handlePlaceOrder}
              placing={placing}
            />
          )}
        </div>

        {/* desktop sidebar */}
        <div className="hidden lg:col-span-5 lg:block">
          <div className="sticky top-24">
            <OrderSidebar cart={cart} />
          </div>
        </div>
      </div>
    </div>
  );
}
