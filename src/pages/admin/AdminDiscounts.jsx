import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiPercent } from 'react-icons/fi';
import api from '../../utils/api';
import toast from 'react-hot-toast';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */
const EMPTY_FORM = {
  name: '',
  code: '',
  scope: 'cart',
  type: 'percentage',
  value: '',
  minCartValue: '',
  maxDiscountCap: '',
  startDate: '',
  endDate: '',
  isActive: true,
  usageLimit: 0,
};

const SCOPE_OPTIONS = [
  { value: 'product', label: 'Product' },
  { value: 'category', label: 'Category' },
  { value: 'cart', label: 'Cart' },
];

const TYPE_OPTIONS = [
  { value: 'percentage', label: 'Percentage' },
  { value: 'flat', label: 'Flat' },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

/** Convert an ISO string to the value format datetime-local inputs need */
const toDatetimeLocal = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  // offset so the local representation is correct
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
};

const discountStatus = (discount) => {
  if (!discount.isActive) return 'inactive';
  const now = Date.now();
  if (discount.endDate && new Date(discount.endDate).getTime() < now) return 'expired';
  if (discount.startDate && new Date(discount.startDate).getTime() > now) return 'scheduled';
  return 'active';
};

const STATUS_STYLES = {
  active:    'bg-green-100 text-green-800',
  inactive:  'bg-gray-100  text-gray-800',
  expired:   'bg-red-100   text-red-800',
  scheduled: 'bg-blue-100  text-blue-800',
};

/* ------------------------------------------------------------------ */
/*  Status Badge                                                       */
/* ------------------------------------------------------------------ */
const StatusBadge = ({ discount }) => {
  const status = discountStatus(discount);
  const base =
    'inline-block rounded-full px-3 py-0.5 text-xs font-semibold capitalize whitespace-nowrap';
  const colour = STATUS_STYLES[status] || 'bg-gray-100 text-gray-800';
  return <span className={`${base} ${colour}`}>{status}</span>;
};

/* ------------------------------------------------------------------ */
/*  Skeleton – Loading State                                           */
/* ------------------------------------------------------------------ */
const SkeletonTable = () => (
  <div className="hidden md:block animate-pulse bg-white rounded-xl shadow-sm p-6 space-y-4">
    <div className="h-5 w-40 bg-gray-200 rounded" />
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="flex gap-4">
        <div className="h-4 w-28 bg-gray-200 rounded" />
        <div className="h-4 w-24 bg-gray-200 rounded" />
        <div className="h-4 w-20 bg-gray-200 rounded" />
        <div className="h-4 w-16 bg-gray-200 rounded" />
        <div className="h-4 w-20 bg-gray-200 rounded" />
        <div className="h-4 w-32 bg-gray-200 rounded" />
        <div className="h-4 w-16 bg-gray-200 rounded" />
        <div className="h-4 w-20 bg-gray-200 rounded" />
      </div>
    ))}
  </div>
);

const SkeletonCards = () => (
  <div className="md:hidden space-y-3">
    {Array.from({ length: 4 }).map((_, i) => (
      <div
        key={i}
        className="animate-pulse rounded-lg border border-gray-200 p-4 space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="h-4 w-32 bg-gray-200 rounded" />
          <div className="h-5 w-16 bg-gray-200 rounded-full" />
        </div>
        <div className="h-3 w-24 bg-gray-200 rounded" />
        <div className="flex justify-between">
          <div className="h-3 w-20 bg-gray-200 rounded" />
          <div className="h-3 w-28 bg-gray-200 rounded" />
        </div>
      </div>
    ))}
  </div>
);

/* ------------------------------------------------------------------ */
/*  Desktop Table                                                      */
/* ------------------------------------------------------------------ */
const DiscountsTable = ({ discounts, onEdit, onDelete }) => (
  <div className="hidden md:block overflow-x-auto">
    <table className="w-full text-left">
      <thead>
        <tr className="border-b border-gray-200 text-sm text-gray-500">
          <th className="pb-3 pr-4 font-medium">Name</th>
          <th className="pb-3 pr-4 font-medium">Code</th>
          <th className="pb-3 pr-4 font-medium">Type</th>
          <th className="pb-3 pr-4 font-medium">Value</th>
          <th className="pb-3 pr-4 font-medium">Scope</th>
          <th className="pb-3 pr-4 font-medium">Date Range</th>
          <th className="pb-3 pr-4 font-medium">Status</th>
          <th className="pb-3 pr-4 font-medium">Usage</th>
          <th className="pb-3 font-medium">Actions</th>
        </tr>
      </thead>
      <tbody className="text-sm text-gray-700">
        {discounts.map((d) => (
          <tr
            key={d._id}
            className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
          >
            <td className="py-3 pr-4 font-medium text-gray-900">{d.name}</td>
            <td className="py-3 pr-4">
              <code className="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono">
                {d.code}
              </code>
            </td>
            <td className="py-3 pr-4 capitalize">{d.type}</td>
            <td className="py-3 pr-4 font-medium">
              {d.type === 'percentage' ? `${d.value}%` : `₹${d.value}`}
            </td>
            <td className="py-3 pr-4 capitalize">{d.scope}</td>
            <td className="py-3 pr-4 whitespace-nowrap text-xs text-gray-500">
              {d.startDate ? formatDate(d.startDate) : '—'}{' '}
              → {d.endDate ? formatDate(d.endDate) : '—'}
            </td>
            <td className="py-3 pr-4">
              <StatusBadge discount={d} />
            </td>
            <td className="py-3 pr-4 whitespace-nowrap">
              {d.usedCount ?? 0}/{d.usageLimit ? d.usageLimit : '∞'}
            </td>
            <td className="py-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onEdit(d)}
                  className="rounded-md p-1.5 text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  title="Edit"
                >
                  <FiEdit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDelete(d)}
                  className="rounded-md p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                  title="Delete"
                >
                  <FiTrash2 className="h-4 w-4" />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Mobile Cards                                                       */
/* ------------------------------------------------------------------ */
const DiscountCards = ({ discounts, onEdit, onDelete }) => (
  <div className="md:hidden space-y-3">
    {discounts.map((d) => (
      <div
        key={d._id}
        className="rounded-lg border border-gray-200 p-4 space-y-2"
      >
        {/* Row 1 – Name + Status */}
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-900">{d.name}</span>
          <StatusBadge discount={d} />
        </div>

        {/* Row 2 – Code */}
        <div>
          <code className="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono">
            {d.code}
          </code>
        </div>

        {/* Row 3 – Type / Value / Scope */}
        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
          <span className="capitalize">{d.type}:</span>
          <span className="font-semibold text-gray-900">
            {d.type === 'percentage' ? `${d.value}%` : `₹${d.value}`}
          </span>
          <span className="text-gray-300">|</span>
          <span className="capitalize">{d.scope}</span>
        </div>

        {/* Row 4 – Date range */}
        <div className="text-xs text-gray-500">
          {d.startDate ? formatDate(d.startDate) : '—'}{' '}
          → {d.endDate ? formatDate(d.endDate) : '—'}
        </div>

        {/* Row 5 – Usage + Actions */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-gray-500">
            Usage: {d.usedCount ?? 0}/{d.usageLimit ? d.usageLimit : '∞'}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(d)}
              className="rounded-md p-1.5 text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
            >
              <FiEdit2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(d)}
              className="rounded-md p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <FiTrash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    ))}
  </div>
);

/* ------------------------------------------------------------------ */
/*  Pagination                                                         */
/* ------------------------------------------------------------------ */
const Pagination = ({ pagination, onPageChange }) => {
  const { page, totalPages } = pagination;
  if (totalPages <= 1) return null;

  /** Build a compact window of page numbers around the current page */
  const pages = [];
  const delta = 1; // how many neighbours either side

  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= page - delta && i <= page + delta)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  return (
    <div className="flex items-center justify-center gap-1 pt-4">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Prev
      </button>

      {pages.map((p, idx) =>
        p === '...' ? (
          <span key={`ellipsis-${idx}`} className="px-2 text-gray-400 text-sm">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              p === page
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {p}
          </button>
        ),
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Next
      </button>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Delete Confirmation Modal                                          */
/* ------------------------------------------------------------------ */
const DeleteModal = ({ discount, loading, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    {/* Backdrop */}
    <div
      className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      onClick={onCancel}
    />

    {/* Dialog */}
    <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Delete Discount</h3>
      <p className="text-sm text-gray-600">
        Are you sure you want to delete{' '}
        <span className="font-semibold text-gray-900">{discount.name}</span>
        {' '}({discount.code})? This action cannot be undone.
      </p>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          onClick={onCancel}
          disabled={loading}
          className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-60"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Deleting…
            </>
          ) : (
            'Delete'
          )}
        </button>
      </div>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Create / Edit Modal                                                */
/* ------------------------------------------------------------------ */
const DiscountFormModal = ({ initial, loading, onSubmit, onClose }) => {
  const isEdit = Boolean(initial?._id);
  const [form, setForm] = useState(() => {
    if (!initial) return { ...EMPTY_FORM };
    return {
      name: initial.name || '',
      code: initial.code || '',
      scope: initial.scope || 'cart',
      type: initial.type || 'percentage',
      value: initial.value ?? '',
      minCartValue: initial.minCartValue ?? '',
      maxDiscountCap: initial.maxDiscountCap ?? '',
      startDate: toDatetimeLocal(initial.startDate),
      endDate: toDatetimeLocal(initial.endDate),
      isActive: initial.isActive ?? true,
      usageLimit: initial.usageLimit ?? 0,
    };
  });

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();

    // basic client-side guards
    if (!form.name.trim()) return toast.error('Name is required');
    if (!form.code.trim()) return toast.error('Code is required');
    if (form.value === '' || Number(form.value) < 0)
      return toast.error('Value must be a positive number');

    const payload = {
      ...form,
      value: Number(form.value),
      minCartValue: form.minCartValue !== '' ? Number(form.minCartValue) : undefined,
      maxDiscountCap: form.maxDiscountCap !== '' ? Number(form.maxDiscountCap) : undefined,
      usageLimit: Number(form.usageLimit) || 0,
      startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
      endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
    };

    onSubmit(payload);
  };

  /* Shared input classes */
  const inputCls =
    'block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors';
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-lg rounded-xl bg-white shadow-xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Edit Discount' : 'Create Discount'}
          </h3>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name + Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Summer Sale"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Code</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => set('code', e.target.value.toUpperCase())}
                placeholder="SUMMER25"
                className={`${inputCls} uppercase`}
              />
              <p className="mt-1 text-xs text-gray-400">Uppercase recommended</p>
            </div>
          </div>

          {/* Scope + Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Scope</label>
              <select
                value={form.scope}
                onChange={(e) => set('scope', e.target.value)}
                className={inputCls}
              >
                {SCOPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Type</label>
              <select
                value={form.type}
                onChange={(e) => set('type', e.target.value)}
                className={inputCls}
              >
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Value */}
          <div>
            <label className={labelCls}>
              Value {form.type === 'percentage' ? '(%)' : '(₹)'}
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={form.value}
              onChange={(e) => set('value', e.target.value)}
              placeholder={form.type === 'percentage' ? '10' : '200'}
              className={inputCls}
            />
          </div>

          {/* Min Cart Value + Max Discount Cap */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Min Cart Value (₹)</label>
              <input
                type="number"
                min="0"
                step="any"
                value={form.minCartValue}
                onChange={(e) => set('minCartValue', e.target.value)}
                placeholder="Optional"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Max Discount Cap (₹)</label>
              <input
                type="number"
                min="0"
                step="any"
                value={form.maxDiscountCap}
                onChange={(e) => set('maxDiscountCap', e.target.value)}
                placeholder="Optional"
                className={inputCls}
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Start Date</label>
              <input
                type="datetime-local"
                value={form.startDate}
                onChange={(e) => set('startDate', e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>End Date</label>
              <input
                type="datetime-local"
                value={form.endDate}
                onChange={(e) => set('endDate', e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          {/* Active toggle + Usage limit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            {/* Toggle */}
            <div>
              <label className={labelCls}>Active</label>
              <button
                type="button"
                onClick={() => set('isActive', !form.isActive)}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                  form.isActive ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                    form.isActive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Usage limit */}
            <div>
              <label className={labelCls}>Usage Limit</label>
              <input
                type="number"
                min="0"
                value={form.usageLimit}
                onChange={(e) => set('usageLimit', e.target.value)}
                className={inputCls}
              />
              <p className="mt-1 text-xs text-gray-400">0 = unlimited</p>
            </div>
          </div>

          {/* Submit / Cancel */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Saving…
                </>
              ) : isEdit ? (
                'Update Discount'
              ) : (
                'Create Discount'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
export default function AdminDiscounts() {
  const [discounts, setDiscounts] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalItems: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Modal state
  const [formModal, setFormModal] = useState(null);   // null | {} (create) | discount (edit)
  const [deleteModal, setDeleteModal] = useState(null); // null | discount

  /* ---- Fetch discounts ---- */
  const fetchDiscounts = async (page = 1) => {
    try {
      setLoading(true);
      const { data } = await api.get('/admin/discounts', {
        params: { page, limit: pagination.limit },
      });
      setDiscounts(data.data?.items ?? []);
      setPagination(data.meta?.pagination ?? {});
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || 'Failed to load discounts';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- Create ---- */
  const handleCreate = async (payload) => {
    try {
      setSubmitting(true);
      await api.post('/admin/discounts', payload);
      toast.success('Discount created');
      setFormModal(null);
      fetchDiscounts(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create discount');
    } finally {
      setSubmitting(false);
    }
  };

  /* ---- Update ---- */
  const handleUpdate = async (payload) => {
    try {
      setSubmitting(true);
      await api.patch(`/admin/discounts/${formModal._id}`, payload);
      toast.success('Discount updated');
      setFormModal(null);
      fetchDiscounts(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update discount');
    } finally {
      setSubmitting(false);
    }
  };

  /* ---- Delete ---- */
  const handleDelete = async () => {
    try {
      setSubmitting(true);
      await api.delete(`/admin/discounts/${deleteModal._id}`);
      toast.success('Discount deleted');
      setDeleteModal(null);

      // if last item on a page > 1, go back a page
      const shouldGoBack = discounts.length === 1 && pagination.page > 1;
      fetchDiscounts(shouldGoBack ? pagination.page - 1 : pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete discount');
    } finally {
      setSubmitting(false);
    }
  };

  /* ---- Loading skeleton ---- */
  if (loading && discounts.length === 0) {
    return (
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="animate-pulse h-7 w-48 bg-gray-200 rounded" />
            <div className="animate-pulse h-4 w-64 bg-gray-200 rounded mt-2" />
          </div>
          <div className="animate-pulse h-10 w-36 bg-gray-200 rounded-lg" />
        </div>
        <SkeletonTable />
        <SkeletonCards />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* ---- Header ---- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Discounts</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage discount codes and promotional offers.
          </p>
        </div>
        <button
          onClick={() => setFormModal({})}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors self-start"
        >
          <FiPlus className="h-4 w-4" />
          Create Discount
        </button>
      </div>

      {/* ---- Content ---- */}
      {discounts.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <FiPercent className="h-16 w-16 text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">
            No discounts yet
          </h2>
          <p className="text-gray-500 mt-1 max-w-sm">
            Create your first discount code to offer promotions to your
            customers.
          </p>
          <button
            onClick={() => setFormModal({})}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <FiPlus className="h-4 w-4" />
            Create Discount
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <DiscountsTable
            discounts={discounts}
            onEdit={(d) => setFormModal(d)}
            onDelete={(d) => setDeleteModal(d)}
          />
          <DiscountCards
            discounts={discounts}
            onEdit={(d) => setFormModal(d)}
            onDelete={(d) => setDeleteModal(d)}
          />
          <Pagination
            pagination={pagination}
            onPageChange={(p) => fetchDiscounts(p)}
          />
        </div>
      )}

      {/* ---- Form Modal (Create / Edit) ---- */}
      {formModal !== null && (
        <DiscountFormModal
          initial={formModal._id ? formModal : null}
          loading={submitting}
          onSubmit={formModal._id ? handleUpdate : handleCreate}
          onClose={() => !submitting && setFormModal(null)}
        />
      )}

      {/* ---- Delete Confirmation Modal ---- */}
      {deleteModal && (
        <DeleteModal
          discount={deleteModal}
          loading={submitting}
          onConfirm={handleDelete}
          onCancel={() => !submitting && setDeleteModal(null)}
        />
      )}
    </div>
  );
}
