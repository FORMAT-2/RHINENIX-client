import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FiPlus,
  FiEdit3,
  FiTrash2,
  FiStar,
  FiHome,
  FiBriefcase,
  FiMapPin,
  FiLoader,
  FiArrowLeft,
  FiX,
  FiAlertTriangle,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

/* ═══════════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════════ */
const MAX_ADDRESSES = 10;

const TYPE_ICONS = { home: FiHome, work: FiBriefcase, other: FiMapPin };

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

/* ═══════════════════════════════════════════════════════════════════
   SKELETON
   ═══════════════════════════════════════════════════════════════════ */
const Sk = ({ className = '' }) => (
  <div className={`animate-pulse rounded-lg bg-gray-200 ${className}`} />
);

function AddressSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Sk className="mb-6 h-8 w-48" />
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-gray-100 bg-white p-5">
            <Sk className="mb-2 h-4 w-40" />
            <Sk className="mb-2 h-4 w-full" />
            <Sk className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   CONFIRM DIALOG
   ═══════════════════════════════════════════════════════════════════ */
function ConfirmDialog({ title, message, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
            <FiAlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <p className="mb-5 text-sm text-gray-600">{message}</p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
          >
            {loading && <FiLoader className="h-4 w-4 animate-spin" />}
            Delete
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ADDRESS FORM
   ═══════════════════════════════════════════════════════════════════ */
function AddressForm({ initial, onSaved, onCancel }) {
  const isEdit = !!initial?._id;
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
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
    if (!/^\d{6}$/.test(form.pincode.trim())) e.pincode = 'Enter a valid 6-digit pincode';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { ...form, phone: form.phone.replace(/\s/g, '') };
      delete payload._id;
      delete payload.__v;
      delete payload.userId;
      delete payload.createdAt;
      delete payload.updatedAt;

      if (isEdit) {
        const { data } = await api.patch(`/users/me/addresses/${initial._id}`, payload);
        toast.success('Address updated');
        onSaved(data.data);
      } else {
        const { data } = await api.post('/users/me/addresses', payload);
        toast.success('Address saved');
        onSaved(data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save address');
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
      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">
          {isEdit ? 'Edit Address' : 'Add New Address'}
        </h3>
        <button type="button" onClick={onCancel} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
          <FiX className="h-5 w-5" />
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Full Name *</label>
          <input type="text" value={form.fullName} onChange={set('fullName')} placeholder="John Doe" className={inputCls('fullName')} />
          {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Phone *</label>
          <input type="tel" value={form.phone} onChange={set('phone')} placeholder="9876543210" maxLength={10} className={inputCls('phone')} />
          {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-gray-700">Address Line 1 *</label>
          <input type="text" value={form.line1} onChange={set('line1')} placeholder="House No., Building, Street" className={inputCls('line1')} />
          {errors.line1 && <p className="mt-1 text-xs text-red-500">{errors.line1}</p>}
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-gray-700">Address Line 2</label>
          <input type="text" value={form.line2} onChange={set('line2')} placeholder="Area, Colony (optional)" className={inputCls('line2')} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Landmark</label>
          <input type="text" value={form.landmark} onChange={set('landmark')} placeholder="Near… (optional)" className={inputCls('landmark')} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">City *</label>
          <input type="text" value={form.city} onChange={set('city')} placeholder="City" className={inputCls('city')} />
          {errors.city && <p className="mt-1 text-xs text-red-500">{errors.city}</p>}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">State *</label>
          <select value={form.state} onChange={set('state')} className={inputCls('state')}>
            <option value="">Select state</option>
            {INDIAN_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {errors.state && <p className="mt-1 text-xs text-red-500">{errors.state}</p>}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Pincode *</label>
          <input type="text" value={form.pincode} onChange={set('pincode')} placeholder="110001" maxLength={6} className={inputCls('pincode')} />
          {errors.pincode && <p className="mt-1 text-xs text-red-500">{errors.pincode}</p>}
        </div>
      </div>

      {/* Type selector */}
      <div className="mt-4">
        <label className="mb-2 block text-xs font-medium text-gray-700">Address Type</label>
        <div className="flex gap-2">
          {['home', 'work', 'other'].map((t) => {
            const Icon = TYPE_ICONS[t];
            const active = form.addressType === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setForm((p) => ({ ...p, addressType: t }))}
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

      {/* Default checkbox */}
      <label className="mt-4 flex items-center gap-2">
        <input
          type="checkbox"
          checked={form.isDefault}
          onChange={set('isDefault')}
          className="h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
        />
        <span className="text-sm text-gray-700">Set as default address</span>
      </label>

      {/* Actions */}
      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-600 disabled:opacity-60"
        >
          {saving && <FiLoader className="h-4 w-4 animate-spin" />}
          {isEdit ? 'Update Address' : 'Save Address'}
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
   ADDRESS CARD
   ═══════════════════════════════════════════════════════════════════ */
function AddressCard({ addr, onEdit, onDelete, onSetDefault }) {
  const Icon = TYPE_ICONS[addr.addressType] || FiMapPin;

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">{addr.fullName}</span>
            <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-gray-600">
              <Icon className="h-3 w-3" />
              {addr.addressType}
            </span>
            {addr.isDefault && (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                <FiStar className="h-3 w-3" />
                Default
              </span>
            )}
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
            {addr.line1}
            {addr.line2 ? `, ${addr.line2}` : ''}
            {addr.landmark ? ` (${addr.landmark})` : ''}
            <br />
            {addr.city}, {addr.state} – {addr.pincode}
          </p>
          <p className="mt-1 text-xs text-gray-500">Phone: {addr.phone}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-50 pt-3">
        <button
          type="button"
          onClick={() => onEdit(addr)}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-primary-600 transition hover:bg-primary-50"
        >
          <FiEdit3 className="h-3.5 w-3.5" />
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(addr._id)}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
        >
          <FiTrash2 className="h-3.5 w-3.5" />
          Delete
        </button>
        {!addr.isDefault && (
          <button
            type="button"
            onClick={() => onSetDefault(addr._id)}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-100"
          >
            <FiStar className="h-3.5 w-3.5" />
            Set as Default
          </button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   EMPTY STATE
   ═══════════════════════════════════════════════════════════════════ */
function EmptyAddresses({ onAdd }) {
  return (
    <div className="py-16 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
        <FiMapPin className="h-10 w-10 text-gray-400" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">No addresses saved</h3>
      <p className="mt-1 text-sm text-gray-500">
        Add a delivery address to get started.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-600"
      >
        <FiPlus className="h-4 w-4" />
        Add Your First Address
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ADDRESSES PAGE
   ═══════════════════════════════════════════════════════════════════ */
export default function AddressesPage() {
  const navigate = useNavigate();
  const { loading: authLoading, isAuthenticated } = useAuth();

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingAddr, setEditingAddr] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [settingDefault, setSettingDefault] = useState(null);

  /* Redirect unauthenticated */
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login', { replace: true, state: { from: { pathname: '/profile/addresses' } } });
    }
  }, [authLoading, isAuthenticated, navigate]);

  /* Fetch addresses */
  const fetchAddresses = useCallback(async () => {
    try {
      setError(null);
      const { data } = await api.get('/users/me/addresses');
      setAddresses(data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load addresses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchAddresses();
  }, [isAuthenticated, fetchAddresses]);

  /* Handlers */
  const handleAdd = () => {
    setEditingAddr(null);
    setShowForm(true);
  };

  const handleEdit = (addr) => {
    setEditingAddr(addr);
    setShowForm(true);
  };

  const handleFormSaved = () => {
    setShowForm(false);
    setEditingAddr(null);
    fetchAddresses();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/users/me/addresses/${deleteId}`);
      toast.success('Address deleted');
      setDeleteId(null);
      fetchAddresses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete address');
    } finally {
      setDeleting(false);
    }
  };

  const handleSetDefault = async (id) => {
    setSettingDefault(id);
    try {
      await api.patch(`/users/me/addresses/${id}`, { isDefault: true });
      toast.success('Default address updated');
      fetchAddresses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update default');
    } finally {
      setSettingDefault(null);
    }
  };

  /* ── Loading / guard ────────────────────────────────────────── */
  if (authLoading || !isAuthenticated || loading) return <AddressSkeleton />;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 pb-24 lg:pb-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/profile"
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <FiArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">My Addresses</h1>
            <p className="text-xs text-gray-500">
              {addresses.length} of {MAX_ADDRESSES} addresses
            </p>
          </div>
        </div>
        {addresses.length < MAX_ADDRESSES && !showForm && (
          <button
            type="button"
            onClick={handleAdd}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-600"
          >
            <FiPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Add New</span>
          </button>
        )}
      </div>

      {/* Max addresses notice */}
      {addresses.length >= MAX_ADDRESSES && !showForm && (
        <div className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          You've reached the maximum of {MAX_ADDRESSES} addresses. Delete an existing address to add a new one.
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
          <button type="button" onClick={fetchAddresses} className="ml-2 font-medium underline">
            Retry
          </button>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="mb-4">
          <AddressForm
            initial={editingAddr}
            onSaved={handleFormSaved}
            onCancel={() => { setShowForm(false); setEditingAddr(null); }}
          />
        </div>
      )}

      {/* List or Empty */}
      {!addresses.length && !showForm ? (
        <EmptyAddresses onAdd={handleAdd} />
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <AddressCard
              key={addr._id}
              addr={addr}
              onEdit={handleEdit}
              onDelete={setDeleteId}
              onSetDefault={handleSetDefault}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <ConfirmDialog
          title="Delete Address"
          message="Are you sure you want to delete this address? This action cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
