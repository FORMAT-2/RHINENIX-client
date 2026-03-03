import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FiStar,
  FiMinus,
  FiPlus,
  FiShoppingCart,
  FiZap,
  FiChevronRight,
  FiCheck,
  FiAlertCircle,
  FiUser,
  FiThumbsUp,
  FiShare2,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/common/ProductCard';
import SITE from '../config/site.constants';

/* ─── Skeleton helpers ──────────────────────────────────────────── */
const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse rounded-lg bg-gray-200 ${className}`} />
);

const PDPSkeleton = () => (
  <div className="mx-auto max-w-7xl px-4 py-4">
    <Skeleton className="aspect-square w-full md:aspect-[4/3] md:max-w-lg" />
    <div className="mt-4 space-y-3">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-7 w-1/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-10 w-full" />
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════
   STAR RATING DISPLAY
   ═══════════════════════════════════════════════════════════════════ */
function Stars({ rating, size = 16, className = '' }) {
  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <FiStar
          key={star}
          size={size}
          className={
            star <= Math.round(rating)
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-gray-300'
          }
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   INTERACTIVE STAR INPUT (for review form)
   ═══════════════════════════════════════════════════════════════════ */
function StarInput({ value, onChange }) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star)}
          className="p-0.5 transition-transform hover:scale-110"
        >
          <FiStar
            size={24}
            className={
              star <= (hover || value)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }
          />
        </button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   IMAGE GALLERY
   ═══════════════════════════════════════════════════════════════════ */
function ImageGallery({ images, productName }) {
  const [active, setActive] = useState(0);
  const thumbRef = useRef(null);

  const list = images?.length ? images : [];
  const hasImages = list.length > 0;

  return (
    <div>
      {/* Main image */}
      <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-100 md:aspect-[4/3]">
        {hasImages ? (
          <img
            src={list[active]}
            alt={`${productName} - image ${active + 1}`}
            className="h-full w-full object-contain transition-opacity duration-200"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
            <span className="text-sm text-gray-400">No image available</span>
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {list.length > 1 && (
        <div
          ref={thumbRef}
          className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar"
        >
          {list.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                i === active
                  ? 'border-primary-500 ring-1 ring-primary-500'
                  : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img
                src={img}
                alt={`Thumbnail ${i + 1}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TABS COMPONENT
   ═══════════════════════════════════════════════════════════════════ */
function Tabs({ tabs, activeTab, onTabChange }) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-gray-200 no-scrollbar">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          className={`relative whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === tab.id
              ? 'text-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {tab.label}
          {activeTab === tab.id && (
            <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary-500" />
          )}
        </button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   REVIEW CARD
   ═══════════════════════════════════════════════════════════════════ */
function ReviewCard({ review }) {
  const user = review.userId;
  const date = new Date(review.createdAt).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="border-b border-gray-100 py-4 last:border-0">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.fullName}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100">
              <FiUser size={14} className="text-primary-500" />
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-gray-800">
              {user?.fullName || 'Anonymous'}
            </p>
            <p className="text-[11px] text-gray-400">{date}</p>
          </div>
        </div>
        <Stars rating={review.rating} size={13} />
      </div>

      {review.title && (
        <h4 className="mt-2 text-sm font-semibold text-gray-800">{review.title}</h4>
      )}
      {review.comment && (
        <p className="mt-1 text-sm leading-relaxed text-gray-600">{review.comment}</p>
      )}

      {review.helpfulCount > 0 && (
        <div className="mt-2 flex items-center gap-1 text-[11px] text-gray-400">
          <FiThumbsUp size={11} />
          {review.helpfulCount} found this helpful
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   REVIEW FORM
   ═══════════════════════════════════════════════════════════════════ */
function ReviewForm({ productId, onSubmitted }) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Please select a star rating');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/products/${productId}/reviews`, { rating, title, comment });
      toast.success('Review submitted!');
      setRating(0);
      setTitle('');
      setComment('');
      onSubmitted?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
      <h4 className="mb-3 text-sm font-bold text-gray-800">Write a Review</h4>

      <div className="mb-3">
        <label className="mb-1 block text-xs font-medium text-gray-600">Your Rating</label>
        <StarInput value={rating} onChange={setRating} />
      </div>

      <div className="mb-3">
        <label className="mb-1 block text-xs font-medium text-gray-600">Title (optional)</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summarise your experience"
          maxLength={120}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>

      <div className="mb-4">
        <label className="mb-1 block text-xs font-medium text-gray-600">Comment</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Tell others what you think about this product…"
          rows={3}
          maxLength={2000}
          className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-primary-500 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-600 disabled:opacity-50"
      >
        {submitting ? 'Submitting…' : 'Submit Review'}
      </button>
    </form>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   RATING BREAKDOWN BAR
   ═══════════════════════════════════════════════════════════════════ */
function RatingBreakdown({ reviews, totalCount, average }) {
  // Build a simple breakdown from fetched reviews (best-effort)
  const counts = useMemo(() => {
    const c = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const s = Math.round(r.rating);
      if (s >= 1 && s <= 5) c[s]++;
    });
    return c;
  }, [reviews]);

  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
      {/* Average */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-4xl font-bold text-gray-900">{(average || 0).toFixed(1)}</span>
        <Stars rating={average || 0} size={18} />
        <span className="text-xs text-gray-400">{totalCount} review{totalCount !== 1 ? 's' : ''}</span>
      </div>

      {/* Bars */}
      <div className="flex-1 space-y-1.5">
        {[5, 4, 3, 2, 1].map((star) => (
          <div key={star} className="flex items-center gap-2">
            <span className="w-3 text-right text-xs font-medium text-gray-500">{star}</span>
            <FiStar size={11} className="shrink-0 fill-yellow-400 text-yellow-400" />
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-yellow-400 transition-all"
                style={{ width: `${(counts[star] / total) * 100}%` }}
              />
            </div>
            <span className="w-6 text-right text-[11px] text-gray-400">{counts[star]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PRODUCT PAGE (PDP)
   ═══════════════════════════════════════════════════════════════════ */
export default function ProductPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth() || {};
  const { addItem } = useCart() || {};

  /* ── State ────────────────────────────────────────────────── */
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [reviews, setReviews] = useState([]);
  const [reviewPagination, setReviewPagination] = useState(null);
  const [reviewPage, setReviewPage] = useState(1);
  const [loadingReviews, setLoadingReviews] = useState(false);

  const [related, setRelated] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [buying, setBuying] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [showReviewForm, setShowReviewForm] = useState(false);

  const reviewsSectionRef = useRef(null);

  /* ── Fetch product ────────────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setProduct(null);
    setError(null);
    setQuantity(1);
    setReviews([]);
    setReviewPage(1);
    setActiveTab('description');
    setShowReviewForm(false);

    api
      .get(`/products/${slug}`)
      .then(({ data }) => {
        if (cancelled) return;
        const p = data.data;
        setProduct(p);

        // Fetch reviews
        fetchReviews(p._id, 1, cancelled);

        // Fetch related products
        const catSlug = p.categoryId?.slug;
        if (catSlug) {
          setLoadingRelated(true);
          api
            .get('/products', { params: { categorySlug: catSlug, limit: 6 } })
            .then(({ data: relData }) => {
              if (!cancelled) {
                const items = (relData.data || []).filter((item) => item._id !== p._id);
                setRelated(items.slice(0, 6));
              }
            })
            .catch(() => {})
            .finally(() => {
              if (!cancelled) setLoadingRelated(false);
            });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err.response?.status === 404
              ? 'Product not found.'
              : 'Failed to load product. Please try again.',
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [slug]);

  /* ── Fetch reviews helper ─────────────────────────────────── */
  const fetchReviews = useCallback(
    async (productId, pageNum, cancelled = false) => {
      setLoadingReviews(true);
      try {
        const { data } = await api.get(`/products/${productId}/reviews`, {
          params: { page: pageNum, limit: 5 },
        });
        if (cancelled) return;
        if (pageNum === 1) {
          setReviews(data.data?.items ?? []);
        } else {
          setReviews((prev) => [...prev, ...(data.data?.items ?? [])]);
        }
        setReviewPagination(data.meta?.pagination ?? null);
        setReviewPage(pageNum);
      } catch {
        // Reviews are optional; fail silently
      } finally {
        if (!cancelled) setLoadingReviews(false);
      }
    },
    [],
  );

  const handleLoadMoreReviews = () => {
    if (!product || !reviewPagination || reviewPage >= reviewPagination.totalPages) return;
    fetchReviews(product._id, reviewPage + 1);
  };

  /* ── Cart / Buy handlers ──────────────────────────────────── */
  const handleAddToCart = useCallback(async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to add items to cart');
      navigate('/login');
      return;
    }
    if (!addItem) return;
    setAdding(true);
    try {
      await addItem(product._id, quantity);
      toast.success('Added to cart!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add to cart');
    } finally {
      setAdding(false);
    }
  }, [isAuthenticated, addItem, product, quantity, navigate]);

  const handleBuyNow = useCallback(async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to continue');
      navigate('/login');
      return;
    }
    if (!addItem) return;
    setBuying(true);
    try {
      await addItem(product._id, quantity);
      navigate('/checkout');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to proceed');
    } finally {
      setBuying(false);
    }
  }, [isAuthenticated, addItem, product, quantity, navigate]);

  const handleAddRelatedToCart = useCallback(
    async (productId) => {
      if (!isAuthenticated) {
        toast.error('Please log in to add items to cart');
        return;
      }
      if (!addItem) return;
      await addItem(productId, 1);
      toast.success('Added to cart!');
    },
    [isAuthenticated, addItem],
  );

  /* ── Share handler ────────────────────────────────────────── */
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: product?.name, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied!');
    }
  };

  /* ── Derived ──────────────────────────────────────────────── */
  const p = product;
  const hasDiscount = p ? p.mrp > p.sellingPrice : false;
  const discountPct = hasDiscount ? Math.round(((p.mrp - p.sellingPrice) / p.mrp) * 100) : 0;
  const outOfStock = p ? p.stockQty <= 0 : true;
  const maxQty = p ? Math.min(p.maxOrderQty || 10, p.stockQty) : 1;
  const minQty = p?.minOrderQty || 1;

  const tabs = [
    { id: 'description', label: 'Description' },
    { id: 'specifications', label: 'Specifications' },
    { id: 'reviews', label: `Reviews${p?.ratingCount ? ` (${p.ratingCount})` : ''}` },
  ];

  const hasMoreReviews = reviewPagination && reviewPage < reviewPagination.totalPages;

  /* ═══════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════ */
  if (loading) return <PDPSkeleton />;

  if (error) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
        <FiAlertCircle size={40} className="mb-3 text-gray-300" />
        <p className="text-sm text-gray-500">{error}</p>
        <Link
          to="/"
          className="mt-4 rounded-lg bg-primary-500 px-5 py-2 text-sm font-semibold text-white"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  if (!p) return null;

  return (
    <div className="min-h-screen bg-white pb-24 md:pb-10">
      {/* ── Breadcrumb ────────────────────────────────────────── */}
      <nav className="mx-auto max-w-7xl px-4 py-3 text-xs text-gray-400">
        <ol className="flex flex-wrap items-center gap-1">
          <li><Link to="/" className="hover:text-primary-500">Home</Link></li>
          <li><FiChevronRight size={10} /></li>
          {p.categoryId?.slug && (
            <>
              <li>
                <Link
                  to={`/category/${p.categoryId.slug}`}
                  className="hover:text-primary-500"
                >
                  {p.categoryId.name}
                </Link>
              </li>
              <li><FiChevronRight size={10} /></li>
            </>
          )}
          <li className="truncate text-gray-600">{p.name}</li>
        </ol>
      </nav>

      {/* ── Main Layout ───────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 md:flex md:gap-8">
        {/* Left: Image Gallery */}
        <div className="md:w-1/2 lg:w-5/12">
          <ImageGallery images={p.images} productName={p.name} />
        </div>

        {/* Right: Product Info */}
        <div className="mt-4 md:mt-0 md:w-1/2 lg:w-7/12">
          {/* Brand */}
          {p.brand && (
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-widest text-gray-400">
              {p.brand}
            </span>
          )}

          {/* Name */}
          <h1 className="text-xl font-bold leading-tight text-gray-900 md:text-2xl lg:text-3xl">
            {p.name}
          </h1>

          {/* Rating */}
          {p.ratingCount > 0 && (
            <button
              type="button"
              onClick={() => {
                setActiveTab('reviews');
                reviewsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="mt-2 flex items-center gap-2"
            >
              <Stars rating={p.ratingAverage} size={15} />
              <span className="text-sm font-medium text-gray-700">
                {p.ratingAverage.toFixed(1)}
              </span>
              <span className="text-sm text-primary-500 hover:underline">
                ({p.ratingCount} review{p.ratingCount !== 1 ? 's' : ''})
              </span>
            </button>
          )}

          {/* Price block */}
          <div className="mt-4 flex items-baseline gap-2.5">
            <span className="text-2xl font-bold text-gray-900 md:text-3xl">
              {SITE.CURRENCY}{p.sellingPrice.toLocaleString('en-IN')}
            </span>
            {hasDiscount && (
              <>
                <span className="text-base text-gray-400 line-through">
                  {SITE.CURRENCY}{p.mrp.toLocaleString('en-IN')}
                </span>
                <span className="rounded-md bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">
                  {discountPct}% OFF
                </span>
              </>
            )}
          </div>
          <p className="mt-0.5 text-[11px] text-gray-400">Inclusive of all taxes</p>

          {/* Stock */}
          <div className="mt-3">
            {outOfStock ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
                <FiAlertCircle size={12} /> Out of Stock
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-600">
                <FiCheck size={12} /> In Stock
              </span>
            )}
          </div>

          {/* Short description */}
          {p.shortDescription && (
            <p className="mt-4 text-sm leading-relaxed text-gray-600">{p.shortDescription}</p>
          )}

          {/* ── Desktop: Qty + CTA buttons ────────────────────── */}
          <div className="mt-6 hidden md:block">
            {!outOfStock && (
              <>
                {/* Quantity */}
                <div className="mb-4 flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-600">Qty:</span>
                  <div className="flex items-center rounded-lg border border-gray-200">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(minQty, q - 1))}
                      disabled={quantity <= minQty}
                      className="px-3 py-2 text-gray-500 transition-colors hover:bg-gray-50 disabled:opacity-30"
                    >
                      <FiMinus size={14} />
                    </button>
                    <span className="min-w-[2.5rem] text-center text-sm font-semibold text-gray-800">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                      disabled={quantity >= maxQty}
                      className="px-3 py-2 text-gray-500 transition-colors hover:bg-gray-50 disabled:opacity-30"
                    >
                      <FiPlus size={14} />
                    </button>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={adding}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-primary-500 py-3 text-sm font-bold text-primary-600 transition-colors hover:bg-primary-50 disabled:opacity-50"
                  >
                    <FiShoppingCart size={18} />
                    {adding ? 'Adding…' : 'Add to Cart'}
                  </button>
                  <button
                    type="button"
                    onClick={handleBuyNow}
                    disabled={buying}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent-500 py-3 text-sm font-bold text-white transition-colors hover:bg-accent-600 disabled:opacity-50"
                  >
                    <FiZap size={18} />
                    {buying ? 'Processing…' : 'Buy Now'}
                  </button>
                </div>
              </>
            )}

            {/* Share */}
            <button
              type="button"
              onClick={handleShare}
              className="mt-3 flex items-center gap-1.5 text-xs font-medium text-gray-400 transition-colors hover:text-gray-600"
            >
              <FiShare2 size={13} /> Share this product
            </button>
          </div>
        </div>
      </div>

      {/* ── Tabs Section ──────────────────────────────────────── */}
      <div ref={reviewsSectionRef} className="mx-auto mt-8 max-w-7xl px-4">
        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="py-5">
          {/* Description */}
          {activeTab === 'description' && (
            <div className="prose prose-sm max-w-none text-gray-700">
              {p.longDescription ? (
                <div dangerouslySetInnerHTML={{ __html: p.longDescription }} />
              ) : p.shortDescription ? (
                <p>{p.shortDescription}</p>
              ) : (
                <p className="text-gray-400">No description available.</p>
              )}
            </div>
          )}

          {/* Specifications */}
          {activeTab === 'specifications' && (
            <div>
              {p.attributes && Object.keys(p.attributes).length > 0 ? (
                <table className="w-full text-sm">
                  <tbody>
                    {Object.entries(p.attributes).map(([key, value], i) => (
                      <tr
                        key={key}
                        className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                      >
                        <td className="px-4 py-2.5 font-medium text-gray-600 capitalize w-1/3">
                          {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}
                        </td>
                        <td className="px-4 py-2.5 text-gray-800">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-gray-400">No specifications available.</p>
              )}
            </div>
          )}

          {/* Reviews */}
          {activeTab === 'reviews' && (
            <div>
              {/* Rating breakdown */}
              {reviews.length > 0 && (
                <RatingBreakdown
                  reviews={reviews}
                  totalCount={p.ratingCount || reviews.length}
                  average={p.ratingAverage}
                />
              )}

              {/* Write a review button / form */}
              {isAuthenticated ? (
                showReviewForm ? (
                  <ReviewForm
                    productId={p._id}
                    onSubmitted={() => {
                      setShowReviewForm(false);
                      fetchReviews(p._id, 1);
                    }}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowReviewForm(true)}
                    className="mb-4 rounded-lg border border-primary-500 px-4 py-2 text-sm font-semibold text-primary-600 transition-colors hover:bg-primary-50"
                  >
                    Write a Review
                  </button>
                )
              ) : (
                <p className="mb-4 text-sm text-gray-400">
                  <Link to="/login" className="text-primary-500 hover:underline">
                    Log in
                  </Link>{' '}
                  to write a review.
                </p>
              )}

              {/* Review list */}
              {reviews.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {reviews.map((r) => (
                    <ReviewCard key={r._id} review={r} />
                  ))}
                </div>
              ) : (
                !loadingReviews && (
                  <p className="text-sm text-gray-400">No reviews yet. Be the first!</p>
                )
              )}

              {/* Load more reviews */}
              {hasMoreReviews && (
                <button
                  type="button"
                  onClick={handleLoadMoreReviews}
                  disabled={loadingReviews}
                  className="mt-4 rounded-lg border border-gray-200 px-5 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-gray-300 disabled:opacity-50"
                >
                  {loadingReviews ? 'Loading…' : 'Load More Reviews'}
                </button>
              )}

              {loadingReviews && reviews.length === 0 && (
                <div className="space-y-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Related Products ──────────────────────────────────── */}
      {related.length > 0 && (
        <section className="mx-auto mt-8 max-w-7xl px-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Related Products</h2>
            {p.categoryId?.slug && (
              <Link
                to={`/category/${p.categoryId.slug}`}
                className="flex items-center gap-0.5 text-sm font-semibold text-primary-500 hover:text-primary-600"
              >
                View All <FiChevronRight size={16} />
              </Link>
            )}
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar snap-x snap-mandatory">
            {related.map((item) => (
              <ProductCard
                key={item._id}
                product={item}
                onAddToCart={handleAddRelatedToCart}
                compact
              />
            ))}
          </div>
        </section>
      )}

      {loadingRelated && (
        <div className="mx-auto mt-8 max-w-7xl px-4">
          <Skeleton className="mb-4 h-5 w-40" />
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="min-w-[150px]">
                <Skeleton className="aspect-square w-full" />
                <div className="mt-2 space-y-1.5">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Mobile Sticky Bottom Bar ──────────────────────────── */}
      {!outOfStock && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] md:hidden">
          <div className="flex items-center gap-3">
            {/* Qty selector */}
            <div className="flex items-center rounded-lg border border-gray-200">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(minQty, q - 1))}
                disabled={quantity <= minQty}
                className="px-2.5 py-2 text-gray-500 disabled:opacity-30"
              >
                <FiMinus size={14} />
              </button>
              <span className="min-w-[2rem] text-center text-sm font-semibold text-gray-800">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                disabled={quantity >= maxQty}
                className="px-2.5 py-2 text-gray-500 disabled:opacity-30"
              >
                <FiPlus size={14} />
              </button>
            </div>

            {/* Add to Cart */}
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={adding}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border-2 border-primary-500 py-2.5 text-sm font-bold text-primary-600 disabled:opacity-50"
            >
              <FiShoppingCart size={16} />
              {adding ? 'Adding…' : 'Cart'}
            </button>

            {/* Buy Now */}
            <button
              type="button"
              onClick={handleBuyNow}
              disabled={buying}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-accent-500 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            >
              <FiZap size={16} />
              {buying ? '…' : 'Buy Now'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
