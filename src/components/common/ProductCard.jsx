import { memo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiShoppingCart, FiStar } from 'react-icons/fi';
import SITE from '../../config/site.constants';

/**
 * Reusable product card used on HomePage, CategoryPage, SearchPage, etc.
 *
 * Props:
 *   product  – product object from the API
 *   onAddToCart(productId) – async handler; if omitted the button still renders
 *   compact  – when true renders a slightly smaller variant (deals section)
 */
function ProductCard({ product, onAddToCart, compact = false }) {
  const [adding, setAdding] = useState(false);

  const {
    _id,
    name,
    slug,
    brand,
    mrp,
    sellingPrice,
    images,
    ratingAverage = 0,
    ratingCount = 0,
    stockQty = 0,
  } = product;

  const hasDiscount = mrp > sellingPrice;
  const discountPct = hasDiscount
    ? Math.round(((mrp - sellingPrice) / mrp) * 100)
    : 0;

  const imgSrc = images?.[0] || '';
  const outOfStock = stockQty <= 0;

  const handleAdd = async (e) => {
    e.preventDefault(); // prevent Link navigation
    e.stopPropagation();
    if (adding || outOfStock || !onAddToCart) return;
    setAdding(true);
    try {
      await onAddToCart(_id);
    } catch {
      /* parent handles toast */
    } finally {
      setAdding(false);
    }
  };

  return (
    <Link
      to={`/product/${slug}`}
      className={`group card flex flex-col ${compact ? 'min-w-[150px]' : 'min-w-[160px]'} snap-start`}
      aria-label={name}
    >
      {/* ── Image ─────────────────────────────────────────── */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
            <span className="text-xs text-gray-400">No image</span>
          </div>
        )}

        {/* Discount badge */}
        {hasDiscount && (
          <span className="absolute left-2 top-2 rounded-md bg-red-500 px-1.5 py-0.5 text-[10px] font-bold leading-tight text-white shadow">
            {discountPct}% OFF
          </span>
        )}

        {/* Out of stock overlay */}
        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="rounded-md bg-white px-3 py-1 text-xs font-semibold text-gray-800">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* ── Details ───────────────────────────────────────── */}
      <div className={`flex flex-1 flex-col ${compact ? 'p-2' : 'p-3'}`}>
        {/* Brand */}
        {brand && (
          <span className="mb-0.5 truncate text-[11px] font-medium uppercase tracking-wide text-gray-400">
            {brand}
          </span>
        )}

        {/* Name */}
        <h3
          className={`font-medium text-gray-800 leading-snug ${
            compact ? 'text-xs line-clamp-1' : 'text-sm line-clamp-2'
          }`}
        >
          {name}
        </h3>

        {/* Rating */}
        {ratingCount > 0 && (
          <div className="mt-1 flex items-center gap-1">
            <span className="inline-flex items-center gap-0.5 rounded bg-green-600 px-1.5 py-[1px] text-[10px] font-semibold text-white leading-tight">
              {ratingAverage.toFixed(1)}
              <FiStar size={9} className="fill-white" />
            </span>
            <span className="text-[10px] text-gray-400">({ratingCount})</span>
          </div>
        )}

        {/* Price row */}
        <div className="mt-auto flex items-baseline gap-1.5 pt-2">
          <span className={`font-bold text-gray-900 ${compact ? 'text-sm' : 'text-base'}`}>
            {SITE.CURRENCY}{sellingPrice.toLocaleString('en-IN')}
          </span>
          {hasDiscount && (
            <span className="text-[11px] text-gray-400 line-through">
              {SITE.CURRENCY}{mrp.toLocaleString('en-IN')}
            </span>
          )}
        </div>

        {/* Add to Cart */}
        <button
          type="button"
          onClick={handleAdd}
          disabled={adding || outOfStock}
          className={`mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg font-semibold transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${
            compact
              ? 'py-1.5 text-xs'
              : 'py-2 text-xs'
          } ${
            outOfStock
              ? 'bg-gray-100 text-gray-400'
              : 'bg-accent-500 hover:bg-accent-600 active:bg-accent-700 text-white'
          }`}
        >
          <FiShoppingCart size={compact ? 12 : 14} />
          {adding ? 'Adding…' : outOfStock ? 'Unavailable' : 'Add to Cart'}
        </button>
      </div>
    </Link>
  );
}

export default memo(ProductCard);
