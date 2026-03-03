import { useState, useEffect, useCallback } from 'react';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiX,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import ImageUpload from '../../components/common/ImageUpload';

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */
const formatCurrency = (amount) =>
  `₹${Number(amount).toLocaleString('en-IN')}`;

const INITIAL_FORM = {
  categoryId: '',
  name: '',
  sku: '',
  brand: '',
  shortDescription: '',
  longDescription: '',
  mrp: '',
  sellingPrice: '',
  stockQty: '',
  minOrderQty: 1,
  maxOrderQty: 10,
  discountType: 'none',
  discountValue: '',
  images: [''],
  tags: '',
  isActive: true,
  isFeatured: false,
};

/* ------------------------------------------------------------------ */
/*  Skeleton – Loading State                                          */
/* ------------------------------------------------------------------ */
const SkeletonTable = () => (
  <div className="hidden md:block animate-pulse space-y-4">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 py-3">
        <div className="h-10 w-10 rounded bg-gray-200 shrink-0" />
        <div className="h-4 w-36 bg-gray-200 rounded" />
        <div className="h-4 w-20 bg-gray-200 rounded" />
        <div className="h-4 w-24 bg-gray-200 rounded" />
        <div className="h-4 w-16 bg-gray-200 rounded" />
        <div className="h-4 w-16 bg-gray-200 rounded" />
        <div className="h-4 w-12 bg-gray-200 rounded" />
        <div className="h-4 w-16 bg-gray-200 rounded" />
        <div className="h-4 w-20 bg-gray-200 rounded ml-auto" />
      </div>
    ))}
  </div>
);

const SkeletonCards = () => (
  <div className="md:hidden animate-pulse space-y-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <div
        key={i}
        className="rounded-lg border border-gray-200 p-4 space-y-3"
      >
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded bg-gray-200 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 bg-gray-200 rounded" />
            <div className="h-3 w-1/2 bg-gray-200 rounded" />
          </div>
        </div>
        <div className="flex gap-4">
          <div className="h-3 w-16 bg-gray-200 rounded" />
          <div className="h-3 w-16 bg-gray-200 rounded" />
          <div className="h-3 w-12 bg-gray-200 rounded" />
        </div>
      </div>
    ))}
  </div>
);

/* ------------------------------------------------------------------ */
/*  Status Badge                                                      */
/* ------------------------------------------------------------------ */
const StatusBadge = ({ active }) => (
  <span
    className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold whitespace-nowrap ${
      active
        ? 'bg-green-100 text-green-800'
        : 'bg-red-100 text-red-800'
    }`}
  >
    {active ? 'Active' : 'Inactive'}
  </span>
);

/* ------------------------------------------------------------------ */
/*  Delete Confirmation Modal                                         */
/* ------------------------------------------------------------------ */
const DeleteModal = ({ product, onCancel, onConfirm, loading }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div
      className="fixed inset-0 bg-black/50 transition-opacity"
      onClick={onCancel}
    />
    <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Delete Product</h3>
      <p className="text-sm text-gray-600">
        Are you sure you want to delete{' '}
        <span className="font-semibold text-gray-900">{product?.name}</span>?
        This action cannot be undone.
      </p>
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
        >
          {loading && (
            <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          )}
          Delete
        </button>
      </div>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Product Form Modal (Create / Edit)                                */
/* ------------------------------------------------------------------ */
const ProductFormModal = ({
  form,
  setForm,
  categories,
  onClose,
  onSubmit,
  loading,
  isEdit,
}) => {
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleImageChange = (index, value) => {
    setForm((prev) => {
      const images = [...prev.images];
      images[index] = value;
      return { ...prev, images };
    });
  };

  const addImageField = () => {
    if (form.images.length >= 8) return;
    setForm((prev) => ({ ...prev, images: [...prev.images, ''] }));
  };

  const removeImageField = (index) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl z-10">
          <h3 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Edit Product' : 'Add Product'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="p-6 space-y-5"
        >
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              name="categoryId"
              value={form.categoryId}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Name / SKU / Brand row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="sku"
                value={form.sku}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand
              </label>
              <input
                type="text"
                name="brand"
                value={form.brand}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
          </div>

          {/* Short Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Short Description
            </label>
            <input
              type="text"
              name="shortDescription"
              value={form.shortDescription}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>

          {/* Long Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Long Description
            </label>
            <textarea
              name="longDescription"
              rows={4}
              value={form.longDescription}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none"
            />
          </div>

          {/* Pricing row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                MRP (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="mrp"
                min="0"
                step="0.01"
                value={form.mrp}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Selling Price (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="sellingPrice"
                min="0"
                step="0.01"
                value={form.sellingPrice}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock Qty <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="stockQty"
                min="0"
                value={form.stockQty}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
          </div>

          {/* Order qty row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Order Qty
              </label>
              <input
                type="number"
                name="minOrderQty"
                min="1"
                value={form.minOrderQty}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Order Qty
              </label>
              <input
                type="number"
                name="maxOrderQty"
                min="1"
                value={form.maxOrderQty}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
          </div>

          {/* Discount row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discount Type
              </label>
              <select
                name="discountType"
                value={form.discountType}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              >
                <option value="none">None</option>
                <option value="percentage">Percentage</option>
                <option value="flat">Flat</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discount Value
              </label>
              <input
                type="number"
                name="discountValue"
                min="0"
                step="0.01"
                value={form.discountValue}
                onChange={handleChange}
                disabled={form.discountType === 'none'}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Images */}
          <ImageUpload
            value={form.images.filter(Boolean)}
            onChange={(urls) => setForm((prev) => ({ ...prev, images: urls }))}
            multiple
            maxFiles={8}
            label="Product Images"
            hint="Upload up to 8 images (max 5 MB each)"
          />

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <input
              type="text"
              name="tags"
              value={form.tags}
              onChange={handleChange}
              placeholder="e.g. organic, vegan, bestseller"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
            <p className="text-xs text-gray-400 mt-1">Separate with commas</p>
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap gap-6">
            <label className="relative inline-flex items-center cursor-pointer gap-3">
              <input
                type="checkbox"
                name="isActive"
                checked={form.isActive}
                onChange={handleChange}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
              <span className="text-sm font-medium text-gray-700">Active</span>
            </label>

            <label className="relative inline-flex items-center cursor-pointer gap-3">
              <input
                type="checkbox"
                name="isFeatured"
                checked={form.isFeatured}
                onChange={handleChange}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
              <span className="text-sm font-medium text-gray-700">
                Featured
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
            >
              {loading && (
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {isEdit ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Desktop Table                                                     */
/* ------------------------------------------------------------------ */
const ProductsTable = ({ products, onEdit, onDelete }) => (
  <div className="hidden md:block overflow-x-auto">
    <table className="w-full text-left">
      <thead>
        <tr className="border-b border-gray-200 text-sm text-gray-500">
          <th className="pb-3 pr-4 font-medium">Image</th>
          <th className="pb-3 pr-4 font-medium">Name</th>
          <th className="pb-3 pr-4 font-medium">SKU</th>
          <th className="pb-3 pr-4 font-medium">Category</th>
          <th className="pb-3 pr-4 font-medium">MRP</th>
          <th className="pb-3 pr-4 font-medium">Price</th>
          <th className="pb-3 pr-4 font-medium">Stock</th>
          <th className="pb-3 pr-4 font-medium">Status</th>
          <th className="pb-3 font-medium text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="text-sm text-gray-700">
        {products.map((product) => (
          <tr
            key={product._id}
            className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
          >
            <td className="py-3 pr-4">
              {product.images?.[0] ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="h-10 w-10 rounded object-cover bg-gray-100"
                />
              ) : (
                <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                  N/A
                </div>
              )}
            </td>
            <td className="py-3 pr-4 font-medium text-gray-900 max-w-[180px] truncate">
              {product.name}
            </td>
            <td className="py-3 pr-4 text-gray-500">{product.sku}</td>
            <td className="py-3 pr-4">{product.categoryId?.name ?? '—'}</td>
            <td className="py-3 pr-4">{formatCurrency(product.mrp)}</td>
            <td className="py-3 pr-4 font-medium">
              {formatCurrency(product.sellingPrice)}
            </td>
            <td className="py-3 pr-4">{product.stockQty}</td>
            <td className="py-3 pr-4">
              <StatusBadge active={product.isActive} />
            </td>
            <td className="py-3 text-right">
              <div className="inline-flex items-center gap-1">
                <button
                  onClick={() => onEdit(product)}
                  className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit"
                >
                  <FiEdit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDelete(product)}
                  className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
/*  Mobile Cards                                                      */
/* ------------------------------------------------------------------ */
const ProductCards = ({ products, onEdit, onDelete }) => (
  <div className="md:hidden space-y-3">
    {products.map((product) => (
      <div
        key={product._id}
        className="rounded-lg border border-gray-200 p-4 space-y-3"
      >
        <div className="flex items-start gap-3">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="h-12 w-12 rounded object-cover bg-gray-100 shrink-0"
            />
          ) : (
            <div className="h-12 w-12 rounded bg-gray-100 flex items-center justify-center text-gray-400 text-xs shrink-0">
              N/A
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate">
              {product.name}
            </p>
            <p className="text-xs text-gray-500">
              {product.categoryId?.name ?? '—'} · {product.sku}
            </p>
          </div>
          <StatusBadge active={product.isActive} />
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="space-x-3">
            <span className="text-gray-400 line-through">
              {formatCurrency(product.mrp)}
            </span>
            <span className="font-semibold text-gray-900">
              {formatCurrency(product.sellingPrice)}
            </span>
          </div>
          <span className="text-gray-500">Stock: {product.stockQty}</span>
        </div>

        <div className="flex justify-end gap-2 pt-1 border-t border-gray-100">
          <button
            onClick={() => onEdit(product)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
          >
            <FiEdit2 className="h-3.5 w-3.5" />
            Edit
          </button>
          <button
            onClick={() => onDelete(product)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
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
/*  Main Component                                                    */
/* ------------------------------------------------------------------ */
export default function AdminProducts() {
  /* ---- State ---- */
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1,
  });

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  /* ---- Debounce search ---- */
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  /* ---- Fetch categories once ---- */
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await api.get('/admin/categories');
        setCategories(data.data?.items ?? data.data ?? []);
      } catch {
        /* silent – categories are supplementary */
      }
    };
    fetchCategories();
  }, []);

  /* ---- Fetch products ---- */
  const fetchProducts = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = { page, limit: pagination.limit };
        if (debouncedSearch) params.q = debouncedSearch;
        if (filterCategory) params.categoryId = filterCategory;

        const { data } = await api.get('/admin/products', { params });
        setProducts(data.data?.items ?? []);
        setPagination((prev) => ({
          ...prev,
          ...(data.meta?.pagination ?? {}),
          page,
        }));
      } catch (err) {
        const message =
          err.response?.data?.message ||
          err.message ||
          'Failed to load products';
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearch, filterCategory, pagination.limit],
  );

  /* Re-fetch when filters change (reset to page 1) */
  useEffect(() => {
    fetchProducts(1);
  }, [fetchProducts]);

  /* ---- Open Create modal ---- */
  const openCreateModal = () => {
    setEditingProduct(null);
    setForm({ ...INITIAL_FORM, images: [''] });
    setFormOpen(true);
  };

  /* ---- Open Edit modal ---- */
  const openEditModal = (product) => {
    setEditingProduct(product);
    setForm({
      categoryId: product.categoryId?._id ?? '',
      name: product.name ?? '',
      sku: product.sku ?? '',
      brand: product.brand ?? '',
      shortDescription: product.shortDescription ?? '',
      longDescription: product.longDescription ?? '',
      mrp: product.mrp ?? '',
      sellingPrice: product.sellingPrice ?? '',
      stockQty: product.stockQty ?? '',
      minOrderQty: product.minOrderQty ?? 1,
      maxOrderQty: product.maxOrderQty ?? 10,
      discountType: product.discountType ?? 'none',
      discountValue: product.discountValue ?? '',
      images:
        product.images?.length > 0 ? [...product.images] : [''],
      tags: Array.isArray(product.tags) ? product.tags.join(', ') : '',
      isActive: product.isActive ?? true,
      isFeatured: product.isFeatured ?? false,
    });
    setFormOpen(true);
  };

  /* ---- Close form modal ---- */
  const closeFormModal = () => {
    setFormOpen(false);
    setEditingProduct(null);
    setForm(INITIAL_FORM);
  };

  /* ---- Submit (Create / Update) ---- */
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        mrp: Number(form.mrp),
        sellingPrice: Number(form.sellingPrice),
        stockQty: Number(form.stockQty),
        minOrderQty: Number(form.minOrderQty),
        maxOrderQty: Number(form.maxOrderQty),
        discountType: form.discountType === 'none' ? null : form.discountType,
        discountValue:
          form.discountType === 'none' ? 0 : Number(form.discountValue),
        images: form.images.filter((url) => typeof url === 'string' && url.trim() !== ''),
        tags: typeof form.tags === 'string'
          ? form.tags
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
          : Array.isArray(form.tags) ? form.tags : [],
      };

      if (editingProduct) {
        await api.patch(`/admin/products/${editingProduct._id}`, payload);
        toast.success('Product updated');
      } else {
        await api.post('/admin/products', payload);
        toast.success('Product created');
      }

      closeFormModal();
      fetchProducts(editingProduct ? pagination.page : 1);
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || 'Something went wrong';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  /* ---- Delete ---- */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/products/${deleteTarget._id}`);
      toast.success('Product deleted');
      setDeleteTarget(null);
      fetchProducts(pagination.page);
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || 'Failed to delete';
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  /* ---- Pagination helpers ---- */
  const goToPrev = () => {
    if (pagination.page > 1) fetchProducts(pagination.page - 1);
  };
  const goToNext = () => {
    if (pagination.page < pagination.totalPages)
      fetchProducts(pagination.page + 1);
  };

  /* ---------------------------------------------------------------- */
  /*  Render                                                          */
  /* ---------------------------------------------------------------- */
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* ---- Header ---- */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your product catalogue.
        </p>
      </div>

      {/* ---- Top bar: Search + Filter + Add ---- */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          />
        </div>

        {/* Category filter */}
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>

        {/* Add Product */}
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors shrink-0"
        >
          <FiPlus className="h-4 w-4" />
          Add Product
        </button>
      </div>

      {/* ---- Content ---- */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        {loading ? (
          <>
            <SkeletonTable />
            <SkeletonCards />
          </>
        ) : products.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <FiSearch className="h-7 w-7 text-gray-300" />
            </div>
            <h2 className="text-lg font-semibold text-gray-700">
              No products found
            </h2>
            <p className="text-sm text-gray-500 mt-1 max-w-sm">
              {debouncedSearch || filterCategory
                ? 'Try adjusting your search or filters.'
                : 'Get started by adding your first product.'}
            </p>
            {!debouncedSearch && !filterCategory && (
              <button
                onClick={openCreateModal}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                <FiPlus className="h-4 w-4" />
                Add Product
              </button>
            )}
          </div>
        ) : (
          <>
            <ProductsTable
              products={products}
              onEdit={openEditModal}
              onDelete={setDeleteTarget}
            />
            <ProductCards
              products={products}
              onEdit={openEditModal}
              onDelete={setDeleteTarget}
            />

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-6 border-t border-gray-100 mt-6">
                <p className="text-sm text-gray-500">
                  Page {pagination.page} of {pagination.totalPages}
                  <span className="hidden sm:inline">
                    {' '}
                    · {pagination.totalItems} product
                    {pagination.totalItems !== 1 && 's'}
                  </span>
                </p>

                <div className="inline-flex items-center gap-2">
                  <button
                    onClick={goToPrev}
                    disabled={pagination.page <= 1}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <FiChevronLeft className="h-4 w-4" />
                    Prev
                  </button>
                  <button
                    onClick={goToNext}
                    disabled={pagination.page >= pagination.totalPages}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next
                    <FiChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ---- Product Form Modal ---- */}
      {formOpen && (
        <ProductFormModal
          form={form}
          setForm={setForm}
          categories={categories}
          onClose={closeFormModal}
          onSubmit={handleSubmit}
          loading={submitting}
          isEdit={!!editingProduct}
        />
      )}

      {/* ---- Delete Confirmation Modal ---- */}
      {deleteTarget && (
        <DeleteModal
          product={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          loading={deleting}
        />
      )}
    </div>
  );
}
