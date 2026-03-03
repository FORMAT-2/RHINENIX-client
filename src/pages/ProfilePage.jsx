import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiPackage,
  FiMapPin,
  FiHeart,
  FiBell,
  FiLock,
  FiFileText,
  FiLogOut,
  FiEdit3,
  FiX,
  FiLoader,
  FiUser,
  FiChevronRight,
  FiCamera,
  FiStar,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

/* ═══════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════ */
function maskEmail(email) {
  if (!email) return '—';
  const [local, domain] = email.split('@');
  if (!domain) return email;
  return `${local.slice(0, 2)}${'•'.repeat(Math.max(local.length - 2, 2))}@${domain}`;
}

function maskPhone(phone) {
  if (!phone) return '—';
  return '•'.repeat(Math.max(phone.length - 4, 2)) + phone.slice(-4);
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/* ═══════════════════════════════════════════════════════════════════
   SKELETON
   ═══════════════════════════════════════════════════════════════════ */
const Sk = ({ className = '' }) => (
  <div className={`animate-pulse rounded-lg bg-gray-200 ${className}`} />
);

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="space-y-4 lg:grid lg:grid-cols-12 lg:gap-6 lg:space-y-0">
        <div className="lg:col-span-4">
          <div className="rounded-xl border border-gray-100 bg-white p-6">
            <div className="flex flex-col items-center">
              <Sk className="h-20 w-20 !rounded-full" />
              <Sk className="mt-4 h-5 w-32" />
              <Sk className="mt-2 h-4 w-44" />
              <Sk className="mt-1 h-4 w-36" />
              <Sk className="mt-3 h-3 w-28" />
            </div>
          </div>
        </div>
        <div className="space-y-3 lg:col-span-8">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Sk key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   AVATAR
   ═══════════════════════════════════════════════════════════════════ */
function Avatar({ user, size = 'lg' }) {
  const sizeMap = {
    lg: 'h-20 w-20 text-2xl',
    sm: 'h-12 w-12 text-base',
  };

  if (user?.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.fullName}
        className={`${sizeMap[size]} rounded-full object-cover ring-2 ring-gray-100`}
      />
    );
  }

  return (
    <div
      className={`${sizeMap[size]} flex items-center justify-center rounded-full bg-primary-100 font-bold text-primary-600 ring-2 ring-primary-50`}
    >
      {getInitials(user?.fullName)}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MENU ITEM
   ═══════════════════════════════════════════════════════════════════ */
function MenuItem({ icon: Icon, emoji, label, to, onClick, badge, count, danger }) {
  const content = (
    <div
      className={`flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3.5 shadow-sm transition-all hover:shadow-md ${
        danger ? 'hover:border-red-200 hover:bg-red-50' : 'hover:border-gray-200'
      }`}
    >
      {emoji && <span className="text-lg">{emoji}</span>}
      {Icon && <Icon className={`h-5 w-5 ${danger ? 'text-red-500' : 'text-gray-500'}`} />}
      <span className={`flex-1 text-sm font-medium ${danger ? 'text-red-600' : 'text-gray-800'}`}>
        {label}
      </span>
      {count !== undefined && (
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
          {count}
        </span>
      )}
      {badge && (
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
          Soon
        </span>
      )}
      {!badge && <FiChevronRight className="h-4 w-4 text-gray-400" />}
    </div>
  );

  if (to) return <Link to={to}>{content}</Link>;
  if (onClick)
    return (
      <button type="button" onClick={onClick} className="w-full text-left">
        {content}
      </button>
    );
  return content;
}

/* ═══════════════════════════════════════════════════════════════════
   EDIT PROFILE MODAL
   ═══════════════════════════════════════════════════════════════════ */
function EditProfileModal({ user, onClose, onSaved }) {
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error('Full name is required');
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.patch('/users/me', {
        fullName: fullName.trim(),
        avatarUrl: avatarUrl.trim() || undefined,
      });
      toast.success('Profile updated');
      onSaved(data.data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Edit Profile</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Full Name *
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-200"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Avatar URL
            </label>
            <div className="relative">
              <FiCamera className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-200"
              />
            </div>
            <p className="mt-1 text-xs text-gray-400">
              Paste a link to your profile picture
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-600 disabled:opacity-60"
            >
              {saving && <FiLoader className="h-4 w-4 animate-spin" />}
              Save Changes
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PROFILE PAGE
   ═══════════════════════════════════════════════════════════════════ */
export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, loading: authLoading, isAuthenticated, logout, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [orderCount, setOrderCount] = useState(null);
  const [addressCount, setAddressCount] = useState(null);

  /* Redirect unauthenticated */
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login', { replace: true, state: { from: { pathname: '/profile' } } });
    }
  }, [authLoading, isAuthenticated, navigate]);

  /* Fetch counts */
  useEffect(() => {
    if (!isAuthenticated) return;
    api
      .get('/orders?page=1&limit=1')
      .then(({ data }) => setOrderCount(data.meta?.pagination?.totalItems ?? 0))
      .catch(() => {});
    api
      .get('/users/me/addresses')
      .then(({ data }) => setAddressCount(data.data?.length ?? 0))
      .catch(() => {});
  }, [isAuthenticated]);

  const handleLogout = useCallback(async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/', { replace: true });
  }, [logout, navigate]);

  const handleProfileSaved = useCallback(
    (updatedUser) => {
      updateUser(updatedUser);
    },
    [updateUser],
  );

  /* ── Loading / guard ────────────────────────────────────────── */
  if (authLoading || !isAuthenticated) return <ProfileSkeleton />;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 pb-24 lg:pb-6">
      <div className="space-y-4 lg:grid lg:grid-cols-12 lg:gap-6 lg:space-y-0">
        {/* ── Sidebar: Profile Header ───────────────────────────── */}
        <div className="lg:col-span-4">
          <div className="sticky top-24 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <Avatar user={user} />

              <h2 className="mt-4 text-lg font-bold text-gray-900">
                {user.fullName}
              </h2>

              {user.email && (
                <p className="mt-1 text-sm text-gray-500">
                  {maskEmail(user.email)}
                </p>
              )}
              {user.phone && (
                <p className="mt-0.5 text-sm text-gray-500">
                  {maskPhone(user.phone)}
                </p>
              )}

              <p className="mt-3 text-xs text-gray-400">
                Member since {formatDate(user.createdAt)}
              </p>

              <button
                type="button"
                onClick={() => setEditing(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-lg border-2 border-primary-500 px-4 py-2 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-50"
              >
                <FiEdit3 className="h-4 w-4" />
                Edit Profile
              </button>
            </div>
          </div>
        </div>

        {/* ── Main: Menu Items ──────────────────────────────────── */}
        <div className="space-y-2.5 lg:col-span-8">
          <MenuItem
            emoji="📦"
            label="My Orders"
            to="/orders"
            count={orderCount}
          />
          <MenuItem
            emoji="📍"
            label="Saved Addresses"
            to="/profile/addresses"
            count={addressCount}
          />
          <MenuItem emoji="❤️" label="Wishlist" badge />
          <MenuItem emoji="🔔" label="Notifications" badge />

          <div className="my-1" />

          <MenuItem
            icon={FiLock}
            label="Privacy Policy"
            to="/policies/privacy-policy"
          />
          <MenuItem
            icon={FiFileText}
            label="Terms & Conditions"
            to="/policies/terms"
          />

          <div className="my-1" />

          <MenuItem
            icon={FiLogOut}
            label="Logout"
            onClick={handleLogout}
            danger
          />
        </div>
      </div>

      {/* ── Edit Modal ──────────────────────────────────────────── */}
      {editing && (
        <EditProfileModal
          user={user}
          onClose={() => setEditing(false)}
          onSaved={handleProfileSaved}
        />
      )}
    </div>
  );
}
