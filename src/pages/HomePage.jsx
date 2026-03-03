import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiTruck, FiShield, FiRefreshCw, FiHeadphones, FiChevronRight } from 'react-icons/fi';
import api from '../utils/api';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/common/ProductCard';
import SITE from '../config/site.constants';

/* ═══════════════════════════════════════════════════════════════════
   SKELETON PRIMITIVES
   Reusable loading placeholders with Tailwind's animate-pulse.
   ═══════════════════════════════════════════════════════════════════ */
const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse rounded-lg bg-gray-200 ${className}`} />
);

const BannerSkeleton = () => (
  <div className="w-full">
    <Skeleton className="h-[180px] w-full md:h-[300px] md:rounded-2xl" />
    <div className="mt-3 flex justify-center gap-2">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-2 w-2 !rounded-full" />
      ))}
    </div>
  </div>
);

const CategorySkeleton = () => (
  <div className="flex gap-4 overflow-hidden md:grid md:grid-cols-4">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="flex shrink-0 flex-col items-center gap-2">
        <Skeleton className="h-20 w-20 !rounded-full" />
        <Skeleton className="h-3 w-16" />
      </div>
    ))}
  </div>
);

const ProductRowSkeleton = ({ count = 4 }) => (
  <div className="flex gap-4 overflow-hidden md:grid md:grid-cols-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="min-w-[160px] flex-shrink-0">
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
   SECTION HEADER
   ═══════════════════════════════════════════════════════════════════ */
function SectionHeader({ title, viewAllTo }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-lg font-bold text-gray-900 md:text-xl">{title}</h2>
      {viewAllTo && (
        <Link
          to={viewAllTo}
          className="flex items-center gap-0.5 text-sm font-semibold text-primary-500 hover:text-primary-600 transition-colors"
        >
          View All <FiChevronRight size={16} />
        </Link>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   1 · BANNER CAROUSEL (HERO)
   ═══════════════════════════════════════════════════════════════════ */
function BannerCarousel({ banners, isFestival }) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const total = banners.length;

  /* Auto-scroll every 4s */
  const startAutoPlay = useCallback(() => {
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % total);
    }, 4000);
  }, [total]);

  const stopAutoPlay = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (total <= 1) return;
    startAutoPlay();
    return stopAutoPlay;
  }, [total, startAutoPlay, stopAutoPlay]);

  const goTo = (index) => {
    stopAutoPlay();
    setCurrent(index);
    startAutoPlay();
  };

  /* Touch swipe */
  const handleTouchStart = (e) => {
    touchStartX.current = e.changedTouches[0].clientX;
  };
  const handleTouchEnd = (e) => {
    touchEndX.current = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      stopAutoPlay();
      setCurrent((prev) => {
        if (diff > 0) return (prev + 1) % total;       // swipe left → next
        return (prev - 1 + total) % total;              // swipe right → prev
      });
      startAutoPlay();
    }
  };

  if (!total) return null;

  const banner = banners[current];

  return (
    <section className="relative w-full">
      {/* Slide container */}
      <div
        className={`relative w-full overflow-hidden md:rounded-2xl ${
          isFestival ? 'ring-2 ring-festival-gold festival-glow' : ''
        }`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {banners.map((b) => (
            <div key={b._id} className="w-full flex-shrink-0">
              {b.ctaLink ? (
                <Link to={b.ctaLink} className="block">
                  <BannerSlide banner={b} />
                </Link>
              ) : (
                <BannerSlide banner={b} />
              )}
            </div>
          ))}
        </div>

        {/* CTA overlay */}
        {(banner.ctaText || banner.title) && (
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/50 via-transparent to-transparent p-4 md:p-8">
            {banner.title && (
              <h2 className="text-lg font-bold text-white drop-shadow-lg md:text-2xl">
                {banner.title}
              </h2>
            )}
            {banner.subtitle && (
              <p className="mt-0.5 text-xs text-white/90 md:text-sm">{banner.subtitle}</p>
            )}
            {banner.ctaText && banner.ctaLink && (
              <Link
                to={banner.ctaLink}
                className="pointer-events-auto mt-2 inline-flex w-fit items-center gap-1 rounded-lg bg-white px-4 py-2 text-xs font-bold text-gray-900 shadow transition-transform hover:scale-105 md:text-sm"
              >
                {banner.ctaText} <FiChevronRight size={14} />
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Dot indicators */}
      {total > 1 && (
        <div className="mt-3 flex justify-center gap-2">
          {banners.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => goTo(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current ? 'w-6 bg-primary-500' : 'w-2 bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function BannerSlide({ banner }) {
  return (
    <div className="relative min-h-[180px] w-full md:min-h-[300px]">
      <img
        src={banner.imageUrl}
        alt={banner.title || 'Banner'}
        className="h-full w-full object-cover min-h-[180px] md:min-h-[300px]"
        loading="eager"
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   2 · CATEGORIES SECTION
   ═══════════════════════════════════════════════════════════════════ */
function CategoriesSection({ categories }) {
  if (!categories.length) return null;

  return (
    <section>
      <SectionHeader title="Shop by Category" />

      <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2 md:grid md:grid-cols-4 md:gap-5 md:overflow-visible">
        {categories.map((cat) => (
          <Link
            key={cat._id}
            to={`/category/${cat.slug}`}
            className="group flex flex-shrink-0 snap-start flex-col items-center gap-2 md:flex-shrink"
          >
            {/* Icon circle */}
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-gray-100 bg-white shadow-sm transition-shadow duration-200 group-hover:shadow-md">
              {cat.iconUrl ? (
                <img
                  src={cat.iconUrl}
                  alt={cat.name}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-accent-100">
                  <span className="text-xl font-bold text-primary-500">
                    {cat.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <span className="w-20 truncate text-center text-xs font-medium text-gray-700 group-hover:text-primary-600 transition-colors">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   3 · PRODUCT ROW (HORIZONTAL SCROLL ON MOBILE, GRID ON DESKTOP)
   Used for Featured and Deals sections.
   ═══════════════════════════════════════════════════════════════════ */
function ProductRow({ title, viewAllTo, products, onAddToCart, compact = false }) {
  if (!products.length) return null;

  return (
    <section>
      <SectionHeader title={title} viewAllTo={viewAllTo} />

      <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-5 md:overflow-visible">
        {products.map((product) => (
          <ProductCard
            key={product._id}
            product={product}
            onAddToCart={onAddToCart}
            compact={compact}
          />
        ))}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   5 · TRUST BADGES
   ═══════════════════════════════════════════════════════════════════ */
const TRUST_BADGES = [
  { icon: FiTruck, label: 'Free Delivery', sub: 'On orders above ₹499' },
  { icon: FiShield, label: 'Secure Payments', sub: '100% protected' },
  { icon: FiRefreshCw, label: 'Easy Returns', sub: '7-day return policy' },
  { icon: FiHeadphones, label: '24/7 Support', sub: 'We\'re here to help' },
];

function TrustBadges() {
  return (
    <section>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
        {TRUST_BADGES.map(({ icon: Icon, label, sub }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-2 rounded-xl border border-gray-100 bg-white p-4 text-center shadow-sm md:p-6"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50">
              <Icon size={22} className="text-primary-500" />
            </div>
            <span className="text-sm font-semibold text-gray-800">{label}</span>
            <span className="text-[11px] text-gray-400 leading-tight">{sub}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   HOME PAGE
   ═══════════════════════════════════════════════════════════════════ */
export default function HomePage() {
  const { isFestival } = useTheme() || {};
  const { addItem } = useCart() || {};

  /* ── Data state ───────────────────────────────────────────── */
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [deals, setDeals] = useState([]);

  /* ── Loading / error state ────────────────────────────────── */
  const [loadingBanners, setLoadingBanners] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [loadingDeals, setLoadingDeals] = useState(true);
  const [error, setError] = useState(null);

  /* ── Fetch all data on mount ──────────────────────────────── */
  useEffect(() => {
    let cancelled = false;

    const fetchAll = async () => {
      // Fire all requests in parallel for speed
      const [bannersRes, categoriesRes, featuredRes, dealsRes] = await Promise.allSettled([
        api.get('/banners'),
        api.get('/categories'),
        api.get('/products', { params: { sortBy: 'rating', limit: 8 } }),
        api.get('/products', { params: { sortBy: 'popularity', limit: 6 } }),
      ]);

      if (cancelled) return;

      // Banners
      if (bannersRes.status === 'fulfilled') {
        setBanners(bannersRes.value.data.data || []);
      }
      setLoadingBanners(false);

      // Categories
      if (categoriesRes.status === 'fulfilled') {
        setCategories(categoriesRes.value.data.data || []);
      }
      setLoadingCategories(false);

      // Featured products
      if (featuredRes.status === 'fulfilled') {
        const items = featuredRes.value.data.data?.items || featuredRes.value.data.data || [];
        setFeatured(items);
      }
      setLoadingFeatured(false);

      // Deals (only products that have a discount)
      if (dealsRes.status === 'fulfilled') {
        const items = dealsRes.value.data.data?.items || dealsRes.value.data.data || [];
        setDeals(items.filter((p) => p.mrp > p.sellingPrice));
      }
      setLoadingDeals(false);

      // Show an error banner only if ALL requests failed
      const allFailed = [bannersRes, categoriesRes, featuredRes, dealsRes].every(
        (r) => r.status === 'rejected',
      );
      if (allFailed) {
        setError('Unable to load content. Please check your connection and try again.');
      }
    };

    fetchAll();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ── Add to cart handler (forwarded to ProductCard) ────────── */
  const handleAddToCart = useCallback(
    async (productId) => {
      if (addItem) await addItem(productId, 1);
    },
    [addItem],
  );

  /* ── Error state ──────────────────────────────────────────── */
  if (error) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
        <p className="text-gray-500">{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="btn-primary mt-4"
        >
          Retry
        </button>
      </div>
    );
  }

  /* ── Render ───────────────────────────────────────────────── */
  return (
    <div className="pb-6">
      {/* 1 · Banner carousel — edge-to-edge on mobile, padded on desktop */}
      <div className="md:mx-auto md:max-w-7xl md:px-4 md:pt-4">
        {loadingBanners ? (
          <BannerSkeleton />
        ) : banners.length > 0 ? (
          <BannerCarousel banners={banners} isFestival={isFestival} />
        ) : null}
      </div>

      {/* All remaining sections sit inside a constrained container */}
      <div className="mx-auto max-w-7xl space-y-8 px-4 pt-6">
        {/* 2 · Categories */}
        {loadingCategories ? <CategorySkeleton /> : <CategoriesSection categories={categories} />}

        {/* 3 · Featured Products */}
        {loadingFeatured ? (
          <ProductRowSkeleton />
        ) : (
          <ProductRow
            title="Featured Products"
            viewAllTo="/search?sortBy=rating"
            products={featured}
            onAddToCart={handleAddToCart}
          />
        )}

        {/* 4 · Deals (only if there are discounted products) */}
        {loadingDeals ? (
          <ProductRowSkeleton count={3} />
        ) : deals.length > 0 ? (
          <ProductRow
            title="Today's Deals 🔥"
            viewAllTo="/search?sortBy=popularity"
            products={deals}
            onAddToCart={handleAddToCart}
            compact
          />
        ) : null}

        {/* 5 · Trust Badges */}
        <TrustBadges />
      </div>
    </div>
  );
}
