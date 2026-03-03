import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import {
  FiSliders,
  FiChevronDown,
  FiX,
  FiCheck,
  FiPackage,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/common/ProductCard';
import SITE from '../config/site.constants';

/* ─── Constants ─────────────────────────────────────────────────── */
const PAGE_LIMIT = 20;

const SORT_OPTIONS = [
  { value: '',           label: 'Relevance' },
  { value: 'price_asc',  label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'latest',     label: 'Newest' },
  { value: 'rating',     label: 'Rating' },
];

/* ─── Skeleton helpers ──────────────────────────────────────────── */
const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse rounded-lg bg-gray-200 ${className}`} />
);

const ProductGridSkeleton = ({ count = 8 }) => (
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i}>
        <Skeleton className="aspect-square w-full" />
        <div className="mt-2 space-y-2 px-1">
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-8 w-full" />
        </div>
      </div>
    ))}
  </div>
);

/* ═══════════════════════════════════════════════════════════════════
   FILTER SHEET (mobile slide-up / desktop sidebar)
   ═══════════════════════════════════════════════════════════════════ */
function FilterSheet({ open, onClose, filters, onChange, onApply, brands }) {
  if (!open) return null;

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity lg:hidden"
        onClick={handleBackdrop}
      />

      {/* Panel */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl transition-transform duration-300 lg:static lg:inset-auto lg:z-auto lg:max-h-none lg:rounded-xl lg:shadow-none lg:border lg:border-gray-100 ${
          open ? 'translate-y-0' : 'translate-y-full lg:translate-y-0'
        }`}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between lg:hidden">
          <h3 className="text-lg font-bold text-gray-900">Filters</h3>
          <button type="button" onClick={onClose} className="rounded-full p-1 hover:bg-gray-100">
            <FiX size={20} />
          </button>
        </div>
        <h3 className="mb-4 hidden text-base font-bold text-gray-900 lg:block">Filters</h3>

        {/* Price Range */}
        <div className="mb-5">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Price Range ({SITE.CURRENCY})
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              placeholder="Min"
              value={filters.minPrice}
              onChange={(e) => onChange({ ...filters, minPrice: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            <span className="text-gray-400">–</span>
            <input
              type="number"
              min={0}
              placeholder="Max"
              value={filters.maxPrice}
              onChange={(e) => onChange({ ...filters, maxPrice: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* In Stock toggle */}
        <div className="mb-5">
          <button
            type="button"
            onClick={() => onChange({ ...filters, inStock: !filters.inStock })}
            className="flex w-full items-center justify-between rounded-lg border border-gray-200 px-3 py-2.5 text-sm"
          >
            <span className="font-medium text-gray-700">In Stock Only</span>
            <span
              className={`flex h-5 w-5 items-center justify-center rounded ${
                filters.inStock ? 'bg-primary-500 text-white' : 'border border-gray-300'
              }`}
            >
              {filters.inStock && <FiCheck size={12} />}
            </span>
          </button>
        </div>

        {/* Brands */}
        {brands.length > 0 && (
          <div className="mb-5">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Brand
            </label>
            <div className="flex flex-wrap gap-2">
              {brands.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() =>
                    onChange({ ...filters, brand: filters.brand === b ? '' : b })
                  }
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    filters.brand === b
                      ? 'border-primary-500 bg-primary-50 text-primary-600'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Apply (mobile) */}
        <button
          type="button"
          onClick={onApply}
          className="mt-2 w-full rounded-xl bg-primary-500 py-3 text-sm font-bold text-white active:bg-primary-600 lg:hidden"
        >
          Apply Filters
        </button>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SORT DROPDOWN
   ═══════════════════════════════════════════════════════════════════ */
function SortDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const current = SORT_OPTIONS.find((o) => o.value === value) || SORT_OPTIONS[0];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:border-gray-300"
      >
        {current.label}
        <FiChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-1 min-w-[180px] rounded-xl border border-gray-100 bg-white py-1 shadow-lg">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`block w-full px-4 py-2 text-left text-sm transition-colors ${
                opt.value === value
                  ? 'bg-primary-50 font-semibold text-primary-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   CATEGORY PAGE
   ═══════════════════════════════════════════════════════════════════ */
export default function CategoryPage() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addItem } = useCart() || {};

  /* ── State ────────────────────────────────────────────────── */
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [brands, setBrands] = useState([]);

  const [loadingCat, setLoadingCat] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || '');
  const [filters, setFilters] = useState({
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    inStock: searchParams.get('inStock') === 'true',
    brand: searchParams.get('brand') || '',
  });
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);

  const stickyRef = useRef(null);

  /* ── Fetch category info ──────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;
    setLoadingCat(true);
    setCategory(null);

    api
      .get('/categories')
      .then(({ data }) => {
        if (cancelled) return;
        const list = data.data || [];
        const found = list.find((c) => c.slug === slug);
        setCategory(found || null);

        // Extract unique brands from all products (we'll also try from initial load)
        // Category-level brand list not available from API; extracted from products later
      })
      .catch(() => {
        if (!cancelled) setCategory(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingCat(false);
      });

    return () => { cancelled = true; };
  }, [slug]);

  /* ── Build query params ───────────────────────────────────── */
  const buildParams = useCallback(
    (pageNum) => {
      const params = { categorySlug: slug, page: pageNum, limit: PAGE_LIMIT };
      if (sortBy) params.sortBy = sortBy;
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;
      if (filters.inStock) params.inStock = true;
      if (filters.brand) params.brand = filters.brand;
      return params;
    },
    [slug, sortBy, filters],
  );

  /* ── Fetch products (page 1 reset) ───────────────────────── */
  useEffect(() => {
    let cancelled = false;
    setLoadingProducts(true);
    setProducts([]);
    setPage(1);
    setError(null);

    api
      .get('/products', { params: buildParams(1) })
      .then(({ data }) => {
        if (cancelled) return;
        const items = data.data?.items ?? [];
        setProducts(items);
        setPagination(data.meta?.pagination ?? null);

        // Extract unique brands from results for filter
        const uniqueBrands = [...new Set(items.map((p) => p.brand).filter(Boolean))].sort();
        setBrands((prev) => {
          const merged = [...new Set([...prev, ...uniqueBrands])].sort();
          return merged;
        });
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load products. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setLoadingProducts(false);
      });

    // Sync URL params
    const newParams = {};
    if (sortBy) newParams.sortBy = sortBy;
    if (filters.minPrice) newParams.minPrice = filters.minPrice;
    if (filters.maxPrice) newParams.maxPrice = filters.maxPrice;
    if (filters.inStock) newParams.inStock = 'true';
    if (filters.brand) newParams.brand = filters.brand;
    setSearchParams(newParams, { replace: true });

    return () => { cancelled = true; };
  }, [slug, sortBy, filters, buildParams, setSearchParams]);

  /* ── Load More handler ────────────────────────────────────── */
  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !pagination || page >= pagination.totalPages) return;
    const nextPage = page + 1;
    setLoadingMore(true);

    try {
      const { data } = await api.get('/products', { params: buildParams(nextPage) });
      const items = data.data?.items ?? [];
      setProducts((prev) => [...prev, ...items]);
      setPagination(data.meta?.pagination ?? null);
      setPage(nextPage);

      // Extract brands from new results
      const uniqueBrands = [...new Set(items.map((p) => p.brand).filter(Boolean))].sort();
      setBrands((prev) => [...new Set([...prev, ...uniqueBrands])].sort());
    } catch {
      toast.error('Failed to load more products');
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, pagination, page, buildParams]);

  /* ── Add to cart ──────────────────────────────────────────── */
  const handleAddToCart = useCallback(
    async (productId) => {
      if (!addItem) {
        toast.error('Please log in to add items to cart');
        return;
      }
      await addItem(productId, 1);
      toast.success('Added to cart!');
    },
    [addItem],
  );

  /* ── Filter apply (mobile) ────────────────────────────────── */
  const handleApplyFilters = () => setFilterOpen(false);

  const hasMore = pagination && page < pagination.totalPages;
  const totalItems = pagination?.totalItems ?? 0;
  const activeFilterCount =
    (filters.minPrice ? 1 : 0) +
    (filters.maxPrice ? 1 : 0) +
    (filters.inStock ? 1 : 0) +
    (filters.brand ? 1 : 0);

  /* ═══════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* ── Category Banner ───────────────────────────────────── */}
      {loadingCat ? (
        <Skeleton className="h-36 w-full !rounded-none md:h-52" />
      ) : category ? (
        <section className="relative">
          {category.bannerUrl ? (
            <img
              src={category.bannerUrl}
              alt={category.name}
              className="h-36 w-full object-cover md:h-52"
            />
          ) : (
            <div className="h-36 w-full bg-gradient-to-br from-primary-500 to-accent-500 md:h-52" />
          )}
          <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 via-transparent to-transparent p-4 md:p-8">
            <h1 className="text-xl font-bold text-white drop-shadow-lg md:text-3xl">
              {category.name}
            </h1>
            {category.description && (
              <p className="mt-1 max-w-xl text-xs text-white/85 line-clamp-2 md:text-sm">
                {category.description}
              </p>
            )}
          </div>
        </section>
      ) : (
        /* Unknown category header */
        <section className="bg-gray-100 px-4 py-6 md:py-10">
          <div className="mx-auto max-w-7xl">
            <h1 className="text-xl font-bold text-gray-900 md:text-3xl capitalize">
              {slug?.replace(/-/g, ' ') || 'Category'}
            </h1>
          </div>
        </section>
      )}

      {/* ── Sticky Sort / Filter Bar ──────────────────────────── */}
      <div
        ref={stickyRef}
        className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur-sm"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-2">
            {/* Filter toggle (mobile / always visible) */}
            <button
              type="button"
              onClick={() => setFilterOpen((v) => !v)}
              className="relative flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:border-gray-300 lg:hidden"
            >
              <FiSliders size={14} />
              Filters
              {activeFilterCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary-500 text-[10px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Product count */}
            {!loadingProducts && (
              <span className="text-xs text-gray-500">
                {totalItems.toLocaleString('en-IN')} product{totalItems !== 1 ? 's' : ''} found
              </span>
            )}
          </div>

          <SortDropdown value={sortBy} onChange={setSortBy} />
        </div>
      </div>

      {/* ── Main Content ──────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 pt-4 lg:flex lg:gap-6">
        {/* Desktop sidebar filters */}
        <aside className="hidden shrink-0 lg:block lg:w-60">
          <div className="sticky top-14">
            <FilterSheet
              open
              onClose={() => {}}
              filters={filters}
              onChange={setFilters}
              onApply={() => {}}
              brands={brands}
            />
          </div>
        </aside>

        {/* Mobile filter sheet */}
        <div className="lg:hidden">
          <FilterSheet
            open={filterOpen}
            onClose={() => setFilterOpen(false)}
            filters={filters}
            onChange={setFilters}
            onApply={handleApplyFilters}
            brands={brands}
          />
        </div>

        {/* Product grid */}
        <div className="flex-1">
          {error ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm text-gray-500">{error}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-4 rounded-lg bg-primary-500 px-5 py-2 text-sm font-semibold text-white"
              >
                Retry
              </button>
            </div>
          ) : loadingProducts ? (
            <ProductGridSkeleton />
          ) : products.length === 0 ? (
            /* ── Empty State ─────────────────────────────────── */
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
                <FiPackage size={40} className="text-gray-300" />
              </div>
              <h3 className="text-base font-semibold text-gray-800">No products found</h3>
              <p className="mt-1 max-w-xs text-sm text-gray-500">
                Try adjusting your filters or browse other categories.
              </p>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setFilters({ minPrice: '', maxPrice: '', inStock: false, brand: '' })
                  }
                  className="mt-4 rounded-lg border border-primary-500 px-4 py-2 text-sm font-semibold text-primary-500 transition-colors hover:bg-primary-50"
                >
                  Clear All Filters
                </button>
              )}
              <Link
                to="/"
                className="mt-3 text-sm font-medium text-primary-500 hover:underline"
              >
                ← Back to Home
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {products.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>

              {/* ── Load More ──────────────────────────────── */}
              {hasMore && (
                <div className="mt-8 flex justify-center">
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="rounded-xl border border-gray-200 bg-white px-8 py-3 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:shadow disabled:opacity-50"
                  >
                    {loadingMore ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-primary-500" />
                        Loading…
                      </span>
                    ) : (
                      `Load More Products`
                    )}
                  </button>
                </div>
              )}

              {/* Page info */}
              {pagination && (
                <p className="mt-4 text-center text-xs text-gray-400">
                  Showing {products.length} of {totalItems.toLocaleString('en-IN')} products
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
