import { useState, useEffect, useCallback } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiCheck, FiSearch } from 'react-icons/fi';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import ImageUpload from '../../components/common/ImageUpload';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */
const ITEMS_PER_PAGE = 20;

const EMPTY_FORM = {
  name: '',
  description: '',
  iconUrl: '',
  bannerUrl: '',
  sortOrder: 0,
  isActive: true,
};

/* ------------------------------------------------------------------ */
/*  Skeleton – Loading State                                           */
/* ------------------------------------------------------------------ */
const SkeletonTableRows = () => (
  <div className="hidden md:block animate-pulse space-y-3">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 px-6 py-4">
        <div className="h-4 w-36 bg-gray-200 rounded" />
        <div className="h-4 w-28 bg-gray-200 rounded" />
        <div className="h-5 w-16 bg-gray-200 rounded-full" />
        <div className="h-4 w-12 bg-gray-200 rounded" />
        <div className="ml-auto flex gap-2">
          <div className="h-8 w-8 bg-gray-200 rounded-lg" />
          <div className="h-8 w-8 bg-gray-200 rounded-lg" />
        </div>
      </div>
    ))}
  </div>
);

const SkeletonCards = () => (
  <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <div
        key={i}
        className="animate-pulse bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-3"
      >
        <div className="h-5 w-32 bg-gray-200 rounded" />
        <div className="h-3 w-24 bg-gray-200 rounded" />
        <div className="flex items-center gap-3">
          <div className="h-5 w-16 bg-gray-200 rounded-full" />
          <div className="h-4 w-20 bg-gray-200 rounded" />
        </div>
        <div className="flex gap-2 pt-2">
          <div className="h-8 flex-1 bg-gray-200 rounded-lg" />
          <div className="h-8 flex-1 bg-gray-200 rounded-lg" />
        </div>
      </div>
    ))}
  </div>
);

/* ------------------------------------------------------------------ */
/*  Status Toggle                                                      */
/* ------------------------------------------------------------------ */
const StatusToggle = ({ isActive, loading, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    disabled={loading}
    className={`
      relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full
      border-2 border-transparent transition-colors duration-200 ease-in-out
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
      ${isActive ? 'bg-green-500' : 'bg-gray-300'}
    `}
    role="switch"
    aria-checked={isActive}
    aria-label={isActive ? 'Active – click to deactivate' : 'Inactive – click to activate'}
  >
    <span
      className={`
        pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow
        ring-0 transition-transform duration-200 ease-in-out
        ${isActive ? 'translate-x-5' : 'translate-x-0'}
      `}
    />
    {loading && (
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
      </span>
    )}
  </button>
);

/* ------------------------------------------------------------------ */
/*  Modal Backdrop                                                     */
/* ------------------------------------------------------------------ */
const ModalBackdrop = ({ children, onClose }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    onClick={(e) => e.target === e.currentTarget && onClose()}
  >
    {children}
  </div>
);

/* ------------------------------------------------------------------ */
/*  Category Form Modal                                                */
/* ------------------------------------------------------------------ */
const CategoryFormModal = ({ category, onClose, onSaved }) => {
  const isEdit = Boolean(category?._id);
  const [form, setForm] = useState(() =>
    isEdit
      ? {
          name: category.name || '',
          description: category.description || '',
          iconUrl: category.iconUrl || '',
          bannerUrl: category.bannerUrl || '',
          sortOrder: category.sortOrder ?? 0,
          isActive: category.isActive ?? true,
        }
      : { ...EMPTY_FORM },
  );
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        const { data } = await api.patch(`/admin/categories/${category._id}`, form);
        toast.success(`"${data.data.name}" updated successfully`);
        onSaved(data.data, 'update');
      } else {
        const { data } = await api.post('/admin/categories', form);
        toast.success(`"${data.data.name}" created successfully`);
        onSaved(data.data, 'create');
      }
      onClose();
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || 'Something went wrong';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="w-full max-w-lg bg-white rounded-xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Edit Category' : 'Add Category'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="cat-name" className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="cat-name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Electronics"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900
                         placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500
                         outline-none transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="cat-desc" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="cat-desc"
              name="description"
              rows={3}
              value={form.description}
              onChange={handleChange}
              placeholder="Short description of this category…"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900
                         placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500
                         outline-none transition-colors resize-none"
            />
          </div>

          {/* Icon + Banner uploads – side by side on wider screens */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ImageUpload
              value={form.iconUrl}
              onChange={(url) => setForm((prev) => ({ ...prev, iconUrl: url }))}
              label="Category Icon"
              hint="Square image, 400×400px recommended"
            />
            <ImageUpload
              value={form.bannerUrl}
              onChange={(url) => setForm((prev) => ({ ...prev, bannerUrl: url }))}
              label="Banner Image"
              hint="Wide image, 1200×400px recommended"
            />
          </div>

          {/* Sort Order + Active toggle */}
          <div className="flex items-end gap-6">
            <div className="flex-1">
              <label htmlFor="cat-sort" className="block text-sm font-medium text-gray-700 mb-1">
                Sort Order
              </label>
              <input
                id="cat-sort"
                name="sortOrder"
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900
                           focus:border-blue-500 focus:ring-1 focus:ring-blue-500
                           outline-none transition-colors"
              />
            </div>
            <div className="flex items-center gap-3 pb-2">
              <label htmlFor="cat-active" className="text-sm font-medium text-gray-700">
                Active
              </label>
              <input
                id="cat-active"
                name="isActive"
                type="checkbox"
                checked={form.isActive}
                onChange={handleChange}
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium
                         text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm
                         font-medium text-white hover:bg-blue-700 transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {isEdit ? 'Updating…' : 'Creating…'}
                </>
              ) : (
                <>
                  <FiCheck className="h-4 w-4" />
                  {isEdit ? 'Update Category' : 'Create Category'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </ModalBackdrop>
  );
};

/* ------------------------------------------------------------------ */
/*  Delete Confirmation Dialog                                         */
/* ------------------------------------------------------------------ */
const DeleteConfirmDialog = ({ category, onClose, onConfirmed }) => {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/admin/categories/${category._id}`);
      toast.success(`"${category.name}" deleted`);
      onConfirmed(category._id);
      onClose();
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || 'Failed to delete category';
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="w-full max-w-sm bg-white rounded-xl shadow-xl p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Delete Category</h3>
        <p className="text-sm text-gray-600">
          Are you sure you want to delete{' '}
          <span className="font-semibold text-gray-900">&ldquo;{category.name}&rdquo;</span>?
          This action cannot be undone.
        </p>
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium
                       text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm
                       font-medium text-white hover:bg-red-700 transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Deleting…
              </>
            ) : (
              <>
                <FiTrash2 className="h-4 w-4" />
                Delete
              </>
            )}
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
};

/* ------------------------------------------------------------------ */
/*  Pagination Controls                                                */
/* ------------------------------------------------------------------ */
const Pagination = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  // Build visible page numbers: always show first, last, current ±1
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…');
    }
  }

  const btnBase =
    'inline-flex items-center justify-center h-9 min-w-[2.25rem] px-2 rounded-lg text-sm font-medium transition-colors';

  return (
    <div className="flex items-center justify-center gap-1 pt-6">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className={`${btnBase} text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        Previous
      </button>

      {pages.map((p, idx) =>
        p === '…' ? (
          <span key={`ellipsis-${idx}`} className="px-1 text-gray-400 select-none">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`${btnBase} ${
              p === page
                ? 'bg-blue-600 text-white shadow-sm'
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
        className={`${btnBase} text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        Next
      </button>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Empty State                                                        */
/* ------------------------------------------------------------------ */
const EmptyState = ({ onAdd }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-50 mb-4">
      <FiPlus className="h-7 w-7 text-blue-500" />
    </div>
    <h2 className="text-xl font-semibold text-gray-700">No categories yet</h2>
    <p className="text-sm text-gray-500 mt-1 max-w-xs">
      Categories help organise your products. Create your first one to get started.
    </p>
    <button
      onClick={onAdd}
      className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5
                 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
    >
      <FiPlus className="h-4 w-4" />
      Add your first category
    </button>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Desktop Table                                                      */
/* ------------------------------------------------------------------ */
const CategoriesTable = ({ categories, togglingId, onToggleStatus, onEdit, onDelete }) => (
  <div className="hidden md:block overflow-x-auto">
    <table className="w-full text-left">
      <thead>
        <tr className="border-b border-gray-200 text-sm text-gray-500">
          <th className="pb-3 pl-6 pr-4 font-medium">Name</th>
          <th className="pb-3 pr-4 font-medium">Slug</th>
          <th className="pb-3 pr-4 font-medium">Status</th>
          <th className="pb-3 pr-4 font-medium">Sort Order</th>
          <th className="pb-3 pr-6 font-medium text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="text-sm text-gray-700">
        {categories.map((cat, idx) => (
          <tr
            key={cat._id}
            className={`border-b border-gray-100 last:border-0 transition-colors ${
              idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'
            } hover:bg-blue-50/40`}
          >
            <td className="py-3.5 pl-6 pr-4">
              <div className="flex items-center gap-3">
                {cat.iconUrl ? (
                  <img
                    src={cat.iconUrl}
                    alt=""
                    className="h-8 w-8 rounded-lg object-cover bg-gray-100"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : (
                  <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-gray-100 text-gray-400 text-xs font-bold">
                    {cat.name?.charAt(0)?.toUpperCase()}
                  </span>
                )}
                <span className="font-medium text-gray-900">{cat.name}</span>
              </div>
            </td>
            <td className="py-3.5 pr-4 text-gray-500 font-mono text-xs">{cat.slug}</td>
            <td className="py-3.5 pr-4">
              <StatusToggle
                isActive={cat.isActive}
                loading={togglingId === cat._id}
                onToggle={() => onToggleStatus(cat)}
              />
            </td>
            <td className="py-3.5 pr-4 text-gray-500">{cat.sortOrder}</td>
            <td className="py-3.5 pr-6">
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => onEdit(cat)}
                  className="inline-flex items-center justify-center h-8 w-8 rounded-lg
                             text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  title="Edit"
                >
                  <FiEdit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDelete(cat)}
                  className="inline-flex items-center justify-center h-8 w-8 rounded-lg
                             text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
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
const CategoriesCards = ({ categories, togglingId, onToggleStatus, onEdit, onDelete }) => (
  <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
    {categories.map((cat) => (
      <div
        key={cat._id}
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-3"
      >
        {/* Top row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            {cat.iconUrl ? (
              <img
                src={cat.iconUrl}
                alt=""
                className="h-9 w-9 rounded-lg object-cover bg-gray-100 shrink-0"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            ) : (
              <span className="flex items-center justify-center h-9 w-9 rounded-lg bg-gray-100 text-gray-400 text-sm font-bold shrink-0">
                {cat.name?.charAt(0)?.toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <p className="font-medium text-gray-900 truncate">{cat.name}</p>
              <p className="text-xs text-gray-400 font-mono truncate">{cat.slug}</p>
            </div>
          </div>
          <span
            className={`shrink-0 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              cat.isActive
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {cat.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>Sort: {cat.sortOrder}</span>
          <StatusToggle
            isActive={cat.isActive}
            loading={togglingId === cat._id}
            onToggle={() => onToggleStatus(cat)}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => onEdit(cat)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border
                       border-gray-200 px-3 py-2 text-sm font-medium text-gray-700
                       hover:bg-gray-50 transition-colors"
          >
            <FiEdit2 className="h-3.5 w-3.5" />
            Edit
          </button>
          <button
            onClick={() => onDelete(cat)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border
                       border-red-200 px-3 py-2 text-sm font-medium text-red-600
                       hover:bg-red-50 transition-colors"
          >
            <FiTrash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      </div>
    ))}
  </div>
);

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
export default function AdminCategories() {
  /* ---- State ---- */
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalItems: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal state
  const [formModal, setFormModal] = useState({ open: false, category: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, category: null });

  // Inline loading for status toggle
  const [togglingId, setTogglingId] = useState(null);

  /* ---- Fetch Categories ---- */
  const fetchCategories = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/categories', {
        params: { page, limit: ITEMS_PER_PAGE },
      });
      setCategories(data.data?.items ?? []);
      if (data.meta?.pagination) {
        setPagination(data.meta.pagination);
      }
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || 'Failed to load categories';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories(1);
  }, [fetchCategories]);

  /* ---- Handlers ---- */
  const handlePageChange = (newPage) => {
    fetchCategories(newPage);
  };

  const openAddModal = () => setFormModal({ open: true, category: null });
  const openEditModal = (cat) => setFormModal({ open: true, category: cat });
  const closeFormModal = () => setFormModal({ open: false, category: null });

  const openDeleteModal = (cat) => setDeleteModal({ open: true, category: cat });
  const closeDeleteModal = () => setDeleteModal({ open: false, category: null });

  const handleSaved = (savedCat, mode) => {
    if (mode === 'create') {
      // Prepend new category or refetch current page
      setCategories((prev) => [savedCat, ...prev]);
      setPagination((prev) => ({ ...prev, totalItems: prev.totalItems + 1 }));
    } else {
      setCategories((prev) =>
        prev.map((c) => (c._id === savedCat._id ? savedCat : c)),
      );
    }
  };

  const handleDeleted = (deletedId) => {
    setCategories((prev) => prev.filter((c) => c._id !== deletedId));
    setPagination((prev) => ({ ...prev, totalItems: Math.max(0, prev.totalItems - 1) }));
  };

  const handleToggleStatus = async (cat) => {
    setTogglingId(cat._id);
    try {
      const { data } = await api.patch(`/admin/categories/${cat._id}`, {
        isActive: !cat.isActive,
      });
      setCategories((prev) =>
        prev.map((c) => (c._id === cat._id ? data.data : c)),
      );
      toast.success(`"${cat.name}" ${data.data.isActive ? 'activated' : 'deactivated'}`);
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || 'Failed to update status';
      toast.error(message);
    } finally {
      setTogglingId(null);
    }
  };

  /* ---- Filtered categories (client-side search within loaded page) ---- */
  const filtered = search.trim()
    ? categories.filter(
        (c) =>
          c.name?.toLowerCase().includes(search.toLowerCase()) ||
          c.slug?.toLowerCase().includes(search.toLowerCase()),
      )
    : categories;

  /* ---- Render ---- */
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* ---- Header ---- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your product categories
            {!loading && (
              <span className="text-gray-400"> · {pagination.totalItems} total</span>
            )}
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5
                     text-sm font-medium text-white shadow-sm hover:bg-blue-700
                     transition-colors self-start sm:self-auto"
        >
          <FiPlus className="h-4 w-4" />
          Add Category
        </button>
      </div>

      {/* ---- Search bar ---- */}
      {!loading && categories.length > 0 && (
        <div className="relative max-w-sm">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories…"
            className="w-full rounded-lg border border-gray-300 bg-white pl-9 pr-4 py-2 text-sm
                       text-gray-900 placeholder:text-gray-400 focus:border-blue-500
                       focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <FiX className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* ---- Content area ---- */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <SkeletonTableRows />
          <SkeletonCards />
        </div>
      ) : categories.length === 0 ? (
        <EmptyState onAdd={openAddModal} />
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500">
            No categories match <span className="font-medium text-gray-700">&ldquo;{search}&rdquo;</span>
          </p>
          <button
            onClick={() => setSearch('')}
            className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm py-4">
          <CategoriesTable
            categories={filtered}
            togglingId={togglingId}
            onToggleStatus={handleToggleStatus}
            onEdit={openEditModal}
            onDelete={openDeleteModal}
          />
          <CategoriesCards
            categories={filtered}
            togglingId={togglingId}
            onToggleStatus={handleToggleStatus}
            onEdit={openEditModal}
            onDelete={openDeleteModal}
          />
        </div>
      )}

      {/* ---- Pagination ---- */}
      {!loading && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
        />
      )}

      {/* ---- Modals ---- */}
      {formModal.open && (
        <CategoryFormModal
          category={formModal.category}
          onClose={closeFormModal}
          onSaved={handleSaved}
        />
      )}

      {deleteModal.open && deleteModal.category && (
        <DeleteConfirmDialog
          category={deleteModal.category}
          onClose={closeDeleteModal}
          onConfirmed={handleDeleted}
        />
      )}
    </div>
  );
}
