import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiGrid, FiSearch, FiShoppingCart, FiUser } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';

const tabs = [
  { to: '/',           label: 'Home',       icon: FiHome },
  { to: '/category',   label: 'Categories', icon: FiGrid },
  { to: '/search',     label: 'Search',     icon: FiSearch },
  { to: '/cart',       label: 'Cart',       icon: FiShoppingCart },
  { to: '/profile',    label: 'Profile',    icon: FiUser },
];

export default function BottomNav() {
  const { pathname } = useLocation();
  const { itemCount } = useCart();

  const isActive = (to) => {
    if (to === '/') return pathname === '/';
    return pathname.startsWith(to);
  };

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.06)] md:hidden mobile-safe-bottom">
      <ul className="flex items-stretch">
        {tabs.map(({ to, label, icon: Icon }) => {
          const active = isActive(to);
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                aria-label={label}
                className={`flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
                  active ? 'text-primary-500' : 'text-gray-400'
                }`}
              >
                <span className="relative">
                  <Icon size={22} />
                  {label === 'Cart' && itemCount > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white leading-none">
                      {itemCount > 99 ? '99+' : itemCount}
                    </span>
                  )}
                </span>
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
