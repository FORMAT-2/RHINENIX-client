import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  FiSearch,
  FiX,
  FiChevronDown,
  FiClock,
  FiTrash2,
  FiPackage,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/common/ProductCard';
import SITE from '../config/site.constants';

/* ─── Constants ─────────────────────────────────────────────────── */
const PAGE_LIMIT = 20;
const RECENT_KEY = 'rhinenix_recent_searches';
const MAX_RECENT = 8;

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

/* ─── Recent searches helpers ───────────────────────────────────── */
function getRecentSearches() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]').slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

function addRecentSearch(query) {
  if (!query?.trim()) return;
  const q = query.trim();
  const recent = getRecentSearches().filter((s) => s !== q);
  recent.unshift(q);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
}

function clearRecentSearches() {
  localStorage.removeItem(RECENT_KEY);
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
   SEARCH PAGE
   ═══════════════════════════════════════════════════════════════════ */
export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addItem } = useCart() || {};

  const urlQuery = searchParams.get('q') || '';

  /* ── State ────────────────────────────────────────────────── */
  const [inputValue, setInputValue] = useState(urlQuery);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || '');
  const [recentSearches, setRecentSearches] = useState(getRecentSearches);
  const [showRecent, setShowRecent] = useState(false);

  const inputRef = useRef(null);
  const recentRef = useRef(null);

  /* ── Close recent searches dropdown on outside click ──────── */
  useEffect(() => {
    const close = (e) => {
      if (
        recentRef.current &&
        !recentRef.current.contains(e.target) &&
        inputRef.current &&
        !inputRef.current.contains(e.target)
      ) {
        setShowRecent(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  /* ── Sync input value when URL changes ────────────────────── */
  useEffect(() => {
    setInputValue(urlQuery);
  }, [urlQuery]);

  /* ── Build query params ───────────────────────────────────── */
  const buildParams = useCallback(
    (pageNum) => {
      const params = { page: pageNum, limit: PAGE_LIMIT };
      if (urlQuery) params.q = urlQuery;
      if (sortBy) params.sortBy = sortBy;
      return params;
    },
    [urlQuery, sortBy],
  );

  /* ── Fetch products (page 1 reset) ───────────────────────── */
  useEffect(() => {
    if (!urlQuery) {
      setProducts([]);
      setPagination(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setProducts([]);
    setPage(1);
    setError(null);

    // Save to recent
    addRecentSearch(urlQuery);
    setRecentSearches(getRecentSearches());

    api
      .get('/products', { params: buildParams(1) })
      .then(({ data }) => {
        if (cancelled) return;
        setProducts(data.data?.items ?? []);
        setPagination(data.meta?.pagination ?? null);
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load results. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [urlQuery, sortBy, buildParams]);

  /* ── Search submit handler ────────────────────────────────── */
  const handleSearch = (e) => {
    e.preventDefault();
    const q = inputValue.trim();
    if (!q) return;
    setShowRecent(false);
    const params = { q };
    if (sortBy) params.sortBy = sortBy;
    setSearchParams(params, { replace: true });
  };

  /* ── Recent search click ──────────────────────────────────── */
  const handleRecentClick = (q) => {
    setInputValue(q);
    setShowRecent(false);
    const params = { q };
    if (sortBy) params.sortBy = sortBy;
    setSearchParams(params, { replace: true });
  };

  /* ── Clear recent searches ────────────────────────────────── */
  const handleClearRecent = () => {
    clearRecentSearches();
    setRecentSearches([]);
  };

  /* ── Clear input ──────────────────────────────────────────── */
  const handleClearInput = () => {
    setInputValue('');
    inputRef.current?.focus();
  };

  /* ── Load More handler ────────────────────────────────────── */
  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !pagination || page >= pagination.totalPages) return;
    const nextPage = page + 1;
    setLoadingMore(true);

    try {
      const { data } = await api.get('/products', { params: buildParams(nextPage) });
      setProducts((prev) => [...prev, ...(data.data?.items ?? [])]);
      setPagination(data.meta?.pagination ?? null);
      setPage(nextPage);
    } catch {
      toast.error('Failed to load more results');
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, pagination, page, buildParams]);

  /* ── Sort change ──────────────────────────────────────────── */
  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    const params = {};
    if (urlQuery) params.q = urlQuery;
    if (newSort) params.sortBy = newSort;
    setSearchParams(params, { replace: true });
  };

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

  const hasMore = pagination && page < pagination.totalPages;
  const totalItems = pagination?.totalItems ?? 0;

  /* ═══════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* ── Search Bar ────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <form onSubmit={handleSearch} className="relative">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <FiSearch
                  size={18}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onFocus={() => recentSearches.length > 0 && !urlQuery && setShowRecent(true)}
                  placeholder={`Search ${SITE.NAME}…`}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-10 text-sm text-gray-800 placeholder-gray-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                {inputValue && (
                  <button
                    type="button"
                    onClick={handleClearInput}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  >
                    <FiX size={16} />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-600"
              >
                Search
              </button>
            </div>

            {/* Recent searches dropdown */}
            {showRecent && recentSearches.length > 0 && (
              <div
                ref={recentRef}
                className="absolute inset-x-0 top-full z-30 mt-1 rounded-xl border border-gray-100 bg-white py-2 shadow-lg"
              >
                <div className="flex items-center justify-between px-4 pb-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Recent Searches
                  </span>
                  <button
                    type="button"
                    onClick={handleClearRecent}
                    className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-500"
                  >
                    <FiTrash2 size={11} /> Clear
                  </button>
                </div>
                {recentSearches.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleRecentClick(q)}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <FiClock size={14} className="shrink-0 text-gray-300" />
                    <span className="truncate">{q}</span>
                  </button>
                ))}
              </div>
            )}
          </form>
        </div>
      </div>

      {/* ── Sort Bar (only when we have a query) ──────────────── */}
      {urlQuery && (
        <div className="border-b border-gray-100 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2">
            {!loading && (
              <span className="text-xs text-gray-500">
                {totalItems > 0
                  ? `${totalItems.toLocaleString('en-IN')} result${totalItems !== 1 ? 's' : ''} for "${urlQuery}"`
                  : ''}
              </span>
            )}
            <SortDropdown value={sortBy} onChange={handleSortChange} />
          </div>
        </div>
      )}

      {/* ── Main Content ──────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 pt-4">
        {!urlQuery ? (
          /* ── No query: show recent searches or landing ──── */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
              <FiSearch size={40} className="text-gray-300" />
            </div>
            <h2 className="text-base font-semibold text-gray-800">
              Search for products
            </h2>
            <p className="mt-1 max-w-xs text-sm text-gray-500">
              Find mobile phones, chargers, cables, and more.
            </p>

            {/* Show recent searches inline */}
            {recentSearches.length > 0 && (
              <div className="mt-6 w-full max-w-sm">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Recent Searches
                  </span>
                  <button
                    type="button"
                    onClick={handleClearRecent}
                    className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-500"
                  >
                    <FiTrash2 size={11} /> Clear
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => handleRecentClick(q)}
                      className="flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-gray-300 hover:bg-white"
                    >
                      <FiClock size={11} className="text-gray-300" />
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : loading ? (
          <ProductGridSkeleton />
        ) : error ? (
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
        ) : products.length === 0 ? (
          /* ── Empty state ──────────────────────────────── */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
              <FiPackage size={40} className="text-gray-300" />
            </div>
            <h3 className="text-base font-semibold text-gray-800">
              No results for &ldquo;{urlQuery}&rdquo;
            </h3>
            <p className="mt-1 max-w-xs text-sm text-gray-500">
              Try a different keyword or check the spelling.
            </p>

            {/* Suggestions */}
            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Suggestions
              </p>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Use broader or fewer keywords</li>
                <li>• Try searching by category or brand</li>
                <li>• Check for typos</li>
              </ul>
            </div>

            <Link
              to="/"
              className="mt-6 text-sm font-medium text-primary-500 hover:underline"
            >
              ← Browse all products
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
                    'Load More Results'
                  )}
                </button>
              </div>
            )}

            {/* Page info */}
            {pagination && (
              <p className="mt-4 text-center text-xs text-gray-400">
                Showing {products.length} of {totalItems.toLocaleString('en-IN')} results
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
