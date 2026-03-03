import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiSearch, FiShoppingCart, FiUser, FiX } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

export default function Header() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { itemCount } = useCart();

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  /* Focus the mobile search input when the overlay opens */
  useEffect(() => {
    if (searchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [searchOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    setSearchOpen(false);
    setQuery('');
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      {/* ── Mobile search overlay ─────────────────────────────── */}
      {searchOpen && (
        <div className="absolute inset-0 z-50 flex items-center bg-white px-3 h-14 md:hidden">
          <form onSubmit={handleSubmit} className="flex flex-1 items-center gap-2">
            <FiSearch className="shrink-0 text-gray-400" size={20} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products…"
              className="flex-1 text-sm bg-transparent outline-none placeholder:text-gray-400"
            />
            <button
              type="button"
              aria-label="Close search"
              onClick={() => {
                setSearchOpen(false);
                setQuery('');
              }}
              className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
            >
              <FiX size={20} className="text-gray-600" />
            </button>
          </form>
        </div>
      )}

      {/* ── Main header bar ───────────────────────────────────── */}
      <div className="mx-auto flex h-14 md:h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="shrink-0 text-xl font-bold text-primary-500 tracking-tight">
          RHINENIX
        </Link>

        {/* Desktop search */}
        <form
          onSubmit={handleSubmit}
          className="hidden md:flex mx-6 flex-1 max-w-lg items-center rounded-lg border border-gray-300 bg-gray-50 px-3 focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500 transition-all"
        >
          <FiSearch className="shrink-0 text-gray-400" size={18} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for phones, chargers, cables…"
            className="flex-1 bg-transparent py-2 pl-2 text-sm outline-none placeholder:text-gray-400"
          />
        </form>

        {/* Right icons */}
        <div className="flex items-center gap-1">
          {/* Mobile search trigger */}
          <button
            type="button"
            aria-label="Open search"
            onClick={() => setSearchOpen(true)}
            className="md:hidden p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <FiSearch size={22} className="text-gray-700" />
          </button>

          {/* User / Login */}
          <Link
            to={isAuthenticated ? '/profile' : '/login'}
            aria-label={isAuthenticated ? 'Profile' : 'Login'}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <FiUser size={22} className="text-gray-700" />
          </Link>

          {/* Cart */}
          <Link
            to="/cart"
            aria-label="Cart"
            className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <FiShoppingCart size={22} className="text-gray-700" />
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white leading-none">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
