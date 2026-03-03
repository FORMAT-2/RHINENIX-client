import { Link } from 'react-router-dom';
import { FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import SITE from '../../config/site.constants';

const quickLinks = [
  { label: 'Home',       to: '/' },
  { label: 'Categories', to: '/category' },
  { label: 'Cart',       to: '/cart' },
  { label: 'My Orders',  to: '/orders' },
];

const policies = [
  { label: 'Privacy Policy',   to: '/policies/privacy-policy' },
  { label: 'Terms of Service', to: '/policies/terms' },
  { label: 'Refund Policy',    to: '/policies/refund-policy' },
  { label: 'Shipping Policy',  to: '/policies/shipping-policy' },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="hidden md:block bg-gray-900 text-gray-300">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* About */}
          <div>
            <h3 className="mb-4 text-lg font-bold text-white">{SITE.NAME}</h3>
            <p className="text-sm leading-relaxed text-gray-400">
              {SITE.DESCRIPTION}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Quick Links
            </h4>
            <ul className="space-y-2.5">
              {quickLinks.map(({ label, to }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Contact Us
            </h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <FiMail className="mt-0.5 shrink-0" size={16} />
                <a href={`mailto:${SITE.SUPPORT_EMAIL}`} className="hover:text-white transition-colors">
                  {SITE.SUPPORT_EMAIL}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <FiPhone className="mt-0.5 shrink-0" size={16} />
                <a href={`tel:${SITE.SUPPORT_PHONE}`} className="hover:text-white transition-colors">
                  {SITE.SUPPORT_PHONE}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <FiMapPin className="mt-0.5 shrink-0" size={16} />
                <span>India</span>
              </li>
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Policies
            </h4>
            <ul className="space-y-2.5">
              {policies.map(({ label, to }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider + copyright */}
        <div className="mt-10 border-t border-gray-800 pt-6 text-center text-xs text-gray-500">
          &copy; {year} {SITE.NAME}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
