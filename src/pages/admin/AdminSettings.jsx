import { useState, useEffect } from 'react';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiX,
  FiLink,
  FiFileText,
} from 'react-icons/fi';
import api from '../../utils/api';
import toast from 'react-hot-toast';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */
const TABS = [
  { key: 'footer', label: 'Footer Links', icon: FiLink },
  { key: 'policies', label: 'Policies', icon: FiFileText },
];

const LINK_TYPES = ['phone', 'email', 'policy', 'social'];

const TYPE_BADGE_STYLES = {
  phone:  'bg-blue-100   text-blue-800',
  email:  'bg-green-100  text-green-800',
  policy: 'bg-purple-100 text-purple-800',
  social: 'bg-orange-100 text-orange-800',
};

const EMPTY_LINK = {
  label: '',
  type: 'phone',
  href: '',
  sortOrder: 0,
  isActive: true,
};

const EMPTY_POLICY = {
  title: '',
  slug: '',
  content: '',
  isPublished: false,
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
const slugify = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');

const extractErrorMessage = (err) =>
  err.response?.data?.message || err.message || 'Something went wrong';

/* ------------------------------------------------------------------ */
/*  Skeleton – Loading States                                         */
/* ------------------------------------------------------------------ */
const SkeletonTable = ({ rows = 5, cols = 5 }) => (
  <div className="animate-pulse bg-white rounded-xl shadow-sm p-6 space-y-4">
    <div className="h-5 w-40 bg-gray-200 rounded" />
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4">
        {Array.from({ length: cols }).map((_, j) => (
          <div
            key={j}
            className="h-4 bg-gray-200 rounded"
            style={{ width: `${60 + Math.random() * 60}px` }}
          />
        ))}
      </div>
    ))}
  </div>
);

/* ------------------------------------------------------------------ */
/*  Type Badge                                                         */
/* ------------------------------------------------------------------ */
const TypeBadge = ({ type }) => {
  const base =
    'inline-block rounded-full px-3 py-0.5 text-xs font-semibold capitalize whitespace-nowrap';
  const colour = TYPE_BADGE_STYLES[type] || 'bg-gray-100 text-gray-800';
  return <span className={`${base} ${colour}`}>{type}</span>;
};

/* ------------------------------------------------------------------ */
/*  Published Badge                                                    */
/* ------------------------------------------------------------------ */
const PublishedBadge = ({ published }) => {
  const base =
    'inline-block rounded-full px-3 py-0.5 text-xs font-semibold whitespace-nowrap';
  const colour = published
    ? 'bg-green-100 text-green-800'
    : 'bg-gray-100 text-gray-500';
  return (
    <span className={`${base} ${colour}`}>
      {published ? 'Published' : 'Draft'}
    </span>
  );
};

/* ------------------------------------------------------------------ */
/*  Toggle Switch                                                      */
/* ------------------------------------------------------------------ */
const Toggle = ({ checked, onChange, disabled = false }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
      checked ? 'bg-blue-600' : 'bg-gray-200'
    }`}
  >
    <span
      className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);

/* ------------------------------------------------------------------ */
/*  Modal Wrapper                                                      */
/* ------------------------------------------------------------------ */
const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-xl p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Delete Confirmation Modal                                          */
/* ------------------------------------------------------------------ */
const ConfirmDeleteModal = ({ open, onClose, onConfirm, itemLabel, loading }) => (
  <Modal open={open} onClose={onClose} title="Confirm Delete">
    <p className="text-sm text-gray-600">
      Are you sure you want to delete{' '}
      <span className="font-semibold text-gray-900">{itemLabel}</span>? This
      action cannot be undone.
    </p>
    <div className="flex items-center justify-end gap-3 pt-2">
      <button
        onClick={onClose}
        disabled={loading}
        className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        onClick={onConfirm}
        disabled={loading}
        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
      >
        {loading ? 'Deleting…' : 'Delete'}
      </button>
    </div>
  </Modal>
);

/* ================================================================== */
/*  FOOTER LINKS TAB                                                   */
/* ================================================================== */
const FooterLinksTab = () => {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  /* Modal state */
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_LINK });

  /* Delete state */
  const [deleteTarget, setDeleteTarget] = useState(null);

  /* ---- Fetch ---- */
  const fetchLinks = async () => {
    try {
      const { data } = await api.get('/admin/settings/footer');
      setLinks(data.data || []);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  /* ---- Open modal ---- */
  const openCreate = () => {
    setEditingLink(null);
    setForm({ ...EMPTY_LINK });
    setModalOpen(true);
  };

  const openEdit = (link) => {
    setEditingLink(link);
    setForm({
      label: link.label || '',
      type: link.type || 'phone',
      href: link.href || '',
      sortOrder: link.sortOrder ?? 0,
      isActive: link.isActive ?? true,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingLink(null);
    setForm({ ...EMPTY_LINK });
  };

  /* ---- Submit ---- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.label.trim() || !form.href.trim()) {
      toast.error('Label and Href are required');
      return;
    }

    setSaving(true);
    try {
      if (editingLink) {
        await api.patch(`/admin/settings/footer/${editingLink._id}`, form);
        toast.success('Footer link updated');
      } else {
        await api.post('/admin/settings/footer', form);
        toast.success('Footer link created');
      }
      closeModal();
      await fetchLinks();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  /* ---- Delete ---- */
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/settings/footer/${deleteTarget._id}`);
      toast.success('Footer link deleted');
      setDeleteTarget(null);
      await fetchLinks();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  /* ---- Inline active toggle ---- */
  const toggleActive = async (link) => {
    try {
      await api.patch(`/admin/settings/footer/${link._id}`, {
        isActive: !link.isActive,
      });
      setLinks((prev) =>
        prev.map((l) =>
          l._id === link._id ? { ...l, isActive: !l.isActive } : l,
        ),
      );
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  /* ---- Loading skeleton ---- */
  if (loading) return <SkeletonTable rows={4} cols={6} />;

  /* ---- Empty state ---- */
  if (links.length === 0 && !loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm">
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <FiLink className="h-14 w-14 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">
            No footer links yet
          </h3>
          <p className="text-sm text-gray-500 mt-1 mb-6">
            Add your first footer link to get started.
          </p>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <FiPlus className="h-4 w-4" />
            Add Footer Link
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {links.length} footer link{links.length !== 1 && 's'}
        </p>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <FiPlus className="h-4 w-4" />
          Add Footer Link
        </button>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 text-sm text-gray-500 bg-gray-50/60">
                <th className="px-6 py-3 font-medium">Label</th>
                <th className="px-6 py-3 font-medium">Type</th>
                <th className="px-6 py-3 font-medium">Href</th>
                <th className="px-6 py-3 font-medium">Sort</th>
                <th className="px-6 py-3 font-medium">Active</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
              {links.map((link) => (
                <tr
                  key={link._id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {link.label}
                  </td>
                  <td className="px-6 py-4">
                    <TypeBadge type={link.type} />
                  </td>
                  <td className="px-6 py-4 max-w-[200px] truncate text-gray-500">
                    {link.href}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {link.sortOrder}
                  </td>
                  <td className="px-6 py-4">
                    <Toggle
                      checked={link.isActive}
                      onChange={() => toggleActive(link)}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(link)}
                        className="rounded-lg p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Edit"
                      >
                        <FiEdit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(link)}
                        className="rounded-lg p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
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
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {links.map((link) => (
          <div
            key={link._id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-gray-900">{link.label}</p>
                <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[200px]">
                  {link.href}
                </p>
              </div>
              <TypeBadge type={link.type} />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span>Sort: {link.sortOrder}</span>
                <Toggle
                  checked={link.isActive}
                  onChange={() => toggleActive(link)}
                />
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEdit(link)}
                  className="rounded-lg p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <FiEdit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setDeleteTarget(link)}
                  className="rounded-lg p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <FiTrash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Form Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingLink ? 'Edit Footer Link' : 'Add Footer Link'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Label */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Label
            </label>
            <input
              type="text"
              value={form.label}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. Customer Support"
              required
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              {LINK_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Href */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Href
            </label>
            <input
              type="text"
              value={form.href}
              onChange={(e) => setForm((f) => ({ ...f, href: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. tel:+911234567890 or /policy/privacy"
              required
            />
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort Order
            </label>
            <input
              type="number"
              value={form.sortOrder}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  sortOrder: parseInt(e.target.value, 10) || 0,
                }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min={0}
            />
          </div>

          {/* Is Active */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Active</label>
            <Toggle
              checked={form.isActive}
              onChange={(val) => setForm((f) => ({ ...f, isActive: val }))}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeModal}
              disabled={saving}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving
                ? 'Saving…'
                : editingLink
                  ? 'Update Link'
                  : 'Create Link'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDeleteModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        itemLabel={deleteTarget?.label || ''}
        loading={deleting}
      />
    </>
  );
};

/* ================================================================== */
/*  POLICIES TAB                                                       */
/* ================================================================== */
const PoliciesTab = () => {
  const [policies, setPolicies] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  /* Modal state */
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_POLICY });

  /* Delete state */
  const [deleteTarget, setDeleteTarget] = useState(null);

  const LIMIT = 20;

  /* ---- Fetch ---- */
  const fetchPolicies = async (p = page) => {
    try {
      const { data } = await api.get(
        `/admin/policies?page=${p}&limit=${LIMIT}`,
      );
      setPolicies(data.data?.items ?? []);
      setPagination(data.meta?.pagination ?? null);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchPolicies(page);
  }, [page]);

  /* ---- Open modal ---- */
  const openCreate = () => {
    setEditingPolicy(null);
    setForm({ ...EMPTY_POLICY });
    setModalOpen(true);
  };

  const openEdit = (policy) => {
    setEditingPolicy(policy);
    setForm({
      title: policy.title || '',
      slug: policy.slug || '',
      content: policy.content || '',
      isPublished: policy.isPublished ?? false,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingPolicy(null);
    setForm({ ...EMPTY_POLICY });
  };

  /* ---- Auto-slug ---- */
  const handleTitleChange = (value) => {
    const updates = { title: value };
    if (!editingPolicy) {
      updates.slug = slugify(value);
    }
    setForm((f) => ({ ...f, ...updates }));
  };

  /* ---- Submit ---- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }

    setSaving(true);
    try {
      if (editingPolicy) {
        await api.patch(`/admin/policies/${editingPolicy._id}`, form);
        toast.success('Policy updated');
      } else {
        await api.post('/admin/policies', form);
        toast.success('Policy created');
      }
      closeModal();
      await fetchPolicies(page);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  /* ---- Delete ---- */
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/policies/${deleteTarget._id}`);
      toast.success('Policy deleted');
      setDeleteTarget(null);
      await fetchPolicies(page);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  /* ---- Pagination helpers ---- */
  const totalPages = pagination
    ? Math.ceil((pagination.total || 0) / LIMIT)
    : 1;

  /* ---- Loading skeleton ---- */
  if (loading) return <SkeletonTable rows={4} cols={4} />;

  /* ---- Empty state ---- */
  if (policies.length === 0 && !loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm">
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <FiFileText className="h-14 w-14 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">
            No policies yet
          </h3>
          <p className="text-sm text-gray-500 mt-1 mb-6">
            Create your first policy page to get started.
          </p>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <FiPlus className="h-4 w-4" />
            Add Policy
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {pagination?.total ?? policies.length} polic
          {(pagination?.total ?? policies.length) !== 1 ? 'ies' : 'y'}
        </p>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <FiPlus className="h-4 w-4" />
          Add Policy
        </button>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 text-sm text-gray-500 bg-gray-50/60">
                <th className="px-6 py-3 font-medium">Title</th>
                <th className="px-6 py-3 font-medium">Slug</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
              {policies.map((policy) => (
                <tr
                  key={policy._id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {policy.title}
                  </td>
                  <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                    {policy.slug}
                  </td>
                  <td className="px-6 py-4">
                    <PublishedBadge published={policy.isPublished} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(policy)}
                        className="rounded-lg p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Edit"
                      >
                        <FiEdit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(policy)}
                        className="rounded-lg p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
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
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {policies.map((policy) => (
          <div
            key={policy._id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-gray-900">{policy.title}</p>
                <p className="text-xs text-gray-400 font-mono mt-0.5">
                  {policy.slug}
                </p>
              </div>
              <PublishedBadge published={policy.isPublished} />
            </div>

            <div className="flex items-center justify-end gap-1">
              <button
                onClick={() => openEdit(policy)}
                className="rounded-lg p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <FiEdit2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setDeleteTarget(policy)}
                className="rounded-lg p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <FiTrash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          {Array.from({ length: totalPages }).map((_, i) => {
            const num = i + 1;
            return (
              <button
                key={num}
                onClick={() => setPage(num)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  num === page
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {num}
              </button>
            );
          })}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* Form Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingPolicy ? 'Edit Policy' : 'Add Policy'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. Privacy Policy"
              required
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slug
            </label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) =>
                setForm((f) => ({ ...f, slug: e.target.value }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="privacy-policy"
            />
            <p className="text-xs text-gray-400 mt-1">
              Auto-generated from title. Used in the URL:{' '}
              <span className="font-mono">/policy/{form.slug || '…'}</span>
            </p>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content
              <span className="ml-1 text-xs text-gray-400 font-normal">
                (HTML supported)
              </span>
            </label>
            <textarea
              value={form.content}
              onChange={(e) =>
                setForm((f) => ({ ...f, content: e.target.value }))
              }
              rows={10}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
              placeholder="<h2>Privacy Policy</h2><p>Your privacy matters to us…</p>"
            />
          </div>

          {/* Is Published */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Published
            </label>
            <Toggle
              checked={form.isPublished}
              onChange={(val) =>
                setForm((f) => ({ ...f, isPublished: val }))
              }
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeModal}
              disabled={saving}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving
                ? 'Saving…'
                : editingPolicy
                  ? 'Update Policy'
                  : 'Create Policy'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDeleteModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        itemLabel={deleteTarget?.title || ''}
        loading={deleting}
      />
    </>
  );
};

/* ================================================================== */
/*  MAIN COMPONENT                                                     */
/* ================================================================== */
export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('footer');

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* ---- Page Header ---- */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage footer links and policy pages for your storefront.
        </p>
      </div>

      {/* ---- Tabs ---- */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6" aria-label="Settings tabs">
          {TABS.map(({ key, label, icon: Icon }) => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`inline-flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors ${
                  active
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ---- Tab Content ---- */}
      {activeTab === 'footer' && <FooterLinksTab />}
      {activeTab === 'policies' && <PoliciesTab />}
    </div>
  );
}
