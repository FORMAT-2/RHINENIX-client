import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiImage } from 'react-icons/fi';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import ImageUpload from '../../components/common/ImageUpload';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */
const PLACEMENT_OPTIONS = [
  { value: 'home_hero',     label: 'Home Hero' },
  { value: 'category_top',  label: 'Category Top' },
  { value: 'sale_strip',    label: 'Sale Strip' },
];

const PLACEMENT_STYLES = {
  home_hero:    'bg-blue-100   text-blue-800',
  category_top: 'bg-purple-100 text-purple-800',
  sale_strip:   'bg-orange-100 text-orange-800',
};

const PLACEMENT_LABELS = {
  home_hero:    'Home Hero',
  category_top: 'Category Top',
  sale_strip:   'Sale Strip',
};

const EMPTY_FORM = {
  title:     '',
  subtitle:  '',
  imageUrl:  '',
  ctaText:   '',
  ctaLink:   '',
  placement: 'home_hero',
  startDate: '',
  endDate:   '',
  priority:  0,
  isActive:  true,
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

/** Convert ISO string to datetime-local input value */
const toDatetimeLocal = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const isValidUrl = (str) => {
  if (!str) return false;
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const apiError = (err) =>
  err.response?.data?.message || err.message || 'Something went wrong';

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */
const PlacementBadge = ({ placement }) => {
  const base   = 'inline-block rounded-full px-3 py-0.5 text-xs font-semibold whitespace-nowrap';
  const colour = PLACEMENT_STYLES[placement] || 'bg-gray-100 text-gray-800';
  const label  = PLACEMENT_LABELS[placement] || placement;
  return <span className={`${base} ${colour}`}>{label}</span>;
};

const StatusBadge = ({ active }) => {
  const base   = 'inline-block rounded-full px-3 py-0.5 text-xs font-semibold whitespace-nowrap';
  const colour = active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600';
  return <span className={`${base} ${colour}`}>{active ? 'Active' : 'Inactive'}</span>;
};

/* ------------------------------------------------------------------ */
/*  Skeleton – Loading State                                           */
/* ------------------------------------------------------------------ */
const SkeletonCards = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: 6 }).map((_, i) => (
      <div
        key={i}
        className="animate-pulse bg-white rounded-xl shadow-sm overflow-hidden"
      >
        {/* Image placeholder */}
        <div className="h-40 bg-gray-200 flex items-center justify-center">
          <FiImage className="h-10 w-10 text-gray-300" />
        </div>

        <div className="p-5 space-y-3">
          <div className="h-4 w-3/4 bg-gray-200 rounded" />
          <div className="h-3 w-1/2 bg-gray-200 rounded" />
          <div className="flex gap-2">
            <div className="h-5 w-20 bg-gray-200 rounded-full" />
            <div className="h-5 w-16 bg-gray-200 rounded-full" />
          </div>
          <div className="h-3 w-2/3 bg-gray-200 rounded" />
          <div className="flex justify-end gap-2 pt-2">
            <div className="h-8 w-8 bg-gray-200 rounded-lg" />
            <div className="h-8 w-8 bg-gray-200 rounded-lg" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

/* ------------------------------------------------------------------ */
/*  Banner Card                                                        */
/* ------------------------------------------------------------------ */
const BannerCard = ({ banner, onEdit, onDelete }) => (
  <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
    {/* Image */}
    {banner.imageUrl && isValidUrl(banner.imageUrl) ? (
      <div className="h-40 overflow-hidden bg-gray-100">
        <img
          src={banner.imageUrl}
          alt={banner.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling?.classList.remove('hidden');
          }}
        />
        <div className="hidden w-full h-full flex items-center justify-center bg-gray-100">
          <FiImage className="h-10 w-10 text-gray-300" />
        </div>
      </div>
    ) : (
      <div className="h-40 bg-gray-100 flex items-center justify-center">
        <FiImage className="h-10 w-10 text-gray-300" />
      </div>
    )}

    {/* Body */}
    <div className="p-5 space-y-3">
      {/* Title / Subtitle */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 truncate">
          {banner.title}
        </h3>
        {banner.subtitle && (
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            {banner.subtitle}
          </p>
        )}
      </div>

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-2">
        <PlacementBadge placement={banner.placement} />
        <StatusBadge active={banner.isActive} />
      </div>

      {/* Date range + priority */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>
          {formatDate(banner.startDate)} — {formatDate(banner.endDate)}
        </p>
        <p>
          Priority: <span className="font-medium text-gray-700">{banner.priority ?? 0}</span>
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-1 border-t border-gray-100">
        <button
          onClick={() => onEdit(banner)}
          className="p-2 rounded-lg text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
          title="Edit"
        >
          <FiEdit2 className="h-4 w-4" />
        </button>
        <button
          onClick={() => onDelete(banner)}
          className="p-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          title="Delete"
        >
          <FiTrash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Empty State                                                        */
/* ------------------------------------------------------------------ */
const EmptyState = ({ onAdd }) => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-4">
    <FiImage className="h-16 w-16 text-gray-300 mb-4" />
    <h2 className="text-xl font-semibold text-gray-700">No banners yet</h2>
    <p className="text-gray-500 mt-1 mb-6">
      Create your first banner to start promoting your store.
    </p>
    <button
      onClick={onAdd}
      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
    >
      <FiPlus className="h-4 w-4" />
      Add Banner
    </button>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Confirm Delete Modal                                               */
/* ------------------------------------------------------------------ */
const DeleteModal = ({ banner, loading, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    {/* Backdrop */}
    <div
      className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      onClick={onCancel}
    />

    <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Delete Banner</h3>
      <p className="text-sm text-gray-600">
        Are you sure you want to delete{' '}
        <span className="font-semibold text-gray-900">"{banner.title}"</span>?
        This action cannot be undone.
      </p>

      <div className="flex justify-end gap-3 pt-2">
        <button
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
        >
          {loading && (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          Delete
        </button>
      </div>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Create / Edit Modal                                                */
/* ------------------------------------------------------------------ */
const BannerFormModal = ({ isEdit, form, setForm, loading, onSubmit, onClose }) => {
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const handleToggle = () => {
    setForm((prev) => ({ ...prev, isActive: !prev.isActive }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 rounded-t-xl px-6 py-4 flex items-center justify-between z-10">
          <h3 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Edit Banner' : 'Create Banner'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="p-6 space-y-5"
        >
          {/* Image Upload + Preview */}
          <ImageUpload
            value={form.imageUrl}
            onChange={(url) => setForm((prev) => ({ ...prev, imageUrl: url }))}
            label="Banner Image"
            hint="Recommended: 1200×400px, max 5 MB"
          />

          {/* Title + Subtitle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                placeholder="Summer Sale"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subtitle
              </label>
              <input
                type="text"
                name="subtitle"
                value={form.subtitle}
                onChange={handleChange}
                placeholder="Up to 50% off"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
              />
            </div>
          </div>

          {/* CTA Text + Link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CTA Text
              </label>
              <input
                type="text"
                name="ctaText"
                value={form.ctaText}
                onChange={handleChange}
                placeholder="Shop Now"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CTA Link
              </label>
              <input
                type="text"
                name="ctaLink"
                value={form.ctaLink}
                onChange={handleChange}
                placeholder="/sale"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
              />
            </div>
          </div>

          {/* Placement + Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Placement
              </label>
              <select
                name="placement"
                value={form.placement}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors bg-white"
              >
                {PLACEMENT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <input
                type="number"
                name="priority"
                value={form.priority}
                onChange={handleChange}
                min={0}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
              />
            </div>
          </div>

          {/* Start Date + End Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="datetime-local"
                name="startDate"
                value={form.startDate}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="datetime-local"
                name="endDate"
                value={form.endDate}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
              />
            </div>
          </div>

          {/* Is Active Toggle */}
          <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-700">Active</p>
              <p className="text-xs text-gray-500">
                Banner will be visible to customers when active.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.isActive}
              onClick={handleToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                form.isActive ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                  form.isActive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
            >
              {loading && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {isEdit ? 'Update Banner' : 'Create Banner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Pagination                                                         */
/* ------------------------------------------------------------------ */
const Pagination = ({ page, totalPages, onChange }) => {
  if (totalPages <= 1) return null;

  /** Build visible page numbers with ellipsis */
  const pages = [];
  const delta = 1; // pages on each side of current

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
    <div className="flex items-center justify-center gap-1 pt-6">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Prev
      </button>

      {pages.map((p, idx) =>
        p === '...' ? (
          <span key={`dot-${idx}`} className="px-2 text-gray-400 text-sm">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`min-w-[36px] px-2 py-1.5 rounded-lg text-sm font-medium transition-colors ${
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
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Next
      </button>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
export default function AdminBanners() {
  /* ----- state ----- */
  const [banners, setBanners]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(1);

  const [showForm, setShowForm]       = useState(false);
  const [editTarget, setEditTarget]   = useState(null);   // banner being edited
  const [form, setForm]               = useState({ ...EMPTY_FORM });
  const [submitting, setSubmitting]   = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null); // banner to delete
  const [deleting, setDeleting]         = useState(false);

  const LIMIT = 20;

  /* ----- fetch banners ----- */
  const fetchBanners = async (p = page) => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/banners', {
        params: { page: p, limit: LIMIT },
      });
      setBanners(data.data?.items ?? []);
      const pag = data.meta?.pagination;
      if (pag) {
        setTotalPages(pag.totalPages ?? Math.ceil((pag.totalItems ?? 0) / LIMIT));
      }
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  /* ----- open create modal ----- */
  const openCreate = () => {
    setEditTarget(null);
    setForm({ ...EMPTY_FORM });
    setShowForm(true);
  };

  /* ----- open edit modal ----- */
  const openEdit = (banner) => {
    setEditTarget(banner);
    setForm({
      title:     banner.title     || '',
      subtitle:  banner.subtitle  || '',
      imageUrl:  banner.imageUrl  || '',
      ctaText:   banner.ctaText   || '',
      ctaLink:   banner.ctaLink   || '',
      placement: banner.placement || 'home_hero',
      startDate: toDatetimeLocal(banner.startDate),
      endDate:   toDatetimeLocal(banner.endDate),
      priority:  banner.priority  ?? 0,
      isActive:  banner.isActive  ?? true,
    });
    setShowForm(true);
  };

  /* ----- close form modal ----- */
  const closeForm = () => {
    if (submitting) return;
    setShowForm(false);
    setEditTarget(null);
    setForm({ ...EMPTY_FORM });
  };

  /* ----- submit create / update ----- */
  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
        endDate:   form.endDate   ? new Date(form.endDate).toISOString()   : undefined,
      };

      if (editTarget) {
        await api.patch(`/admin/banners/${editTarget._id}`, payload);
        toast.success('Banner updated');
      } else {
        await api.post('/admin/banners', payload);
        toast.success('Banner created');
      }

      closeForm();
      fetchBanners(editTarget ? page : 1);
      if (!editTarget) setPage(1);
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  /* ----- delete ----- */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/banners/${deleteTarget._id}`);
      toast.success('Banner deleted');
      setDeleteTarget(null);
      fetchBanners(page);
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setDeleting(false);
    }
  };

  /* ----- render: loading ----- */
  if (loading && banners.length === 0) {
    return (
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <div>
          <div className="animate-pulse h-7 w-48 bg-gray-200 rounded" />
          <div className="animate-pulse h-4 w-64 bg-gray-200 rounded mt-2" />
        </div>
        <SkeletonCards />
      </div>
    );
  }

  /* ----- render: empty ----- */
  if (!loading && banners.length === 0) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <EmptyState onAdd={openCreate} />

        {showForm && (
          <BannerFormModal
            isEdit={false}
            form={form}
            setForm={setForm}
            loading={submitting}
            onSubmit={handleSubmit}
            onClose={closeForm}
          />
        )}
      </div>
    );
  }

  /* ----- render: main ----- */
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Banners</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage promotional banners across your storefront.
          </p>
        </div>

        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors self-start sm:self-auto"
        >
          <FiPlus className="h-4 w-4" />
          Add Banner
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {banners.map((banner) => (
          <BannerCard
            key={banner._id}
            banner={banner}
            onEdit={openEdit}
            onDelete={setDeleteTarget}
          />
        ))}
      </div>

      {/* Pagination */}
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      {/* Form Modal */}
      {showForm && (
        <BannerFormModal
          isEdit={!!editTarget}
          form={form}
          setForm={setForm}
          loading={submitting}
          onSubmit={handleSubmit}
          onClose={closeForm}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <DeleteModal
          banner={deleteTarget}
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => !deleting && setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
