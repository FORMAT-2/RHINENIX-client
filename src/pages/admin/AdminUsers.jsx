import { useState, useEffect, useCallback } from 'react';
import {
  FiSearch,
  FiChevronDown,
  FiChevronUp,
  FiShield,
  FiSlash,
  FiCheck,
} from 'react-icons/fi';
import api from '../../utils/api';
import toast from 'react-hot-toast';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */
const PAGE_LIMIT = 20;

const USER_STATUS_STYLES = {
  active:  'bg-green-100 text-green-800',
  blocked: 'bg-red-100   text-red-800',
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

const formatDateTime = (iso) =>
  new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

/* ------------------------------------------------------------------ */
/*  Micro-components                                                   */
/* ------------------------------------------------------------------ */
const StatusBadge = ({ status }) => {
  const base =
    'inline-block rounded-full px-3 py-0.5 text-xs font-semibold capitalize whitespace-nowrap';
  const colour = USER_STATUS_STYLES[status] || 'bg-gray-100 text-gray-800';
  return <span className={`${base} ${colour}`}>{status}</span>;
};

/* ------------------------------------------------------------------ */
/*  Skeleton – Loading State                                           */
/* ------------------------------------------------------------------ */
const SkeletonRows = () => (
  <>
    {/* Desktop skeleton */}
    <div className="hidden md:block animate-pulse space-y-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-3">
          <div className="h-4 w-32 bg-gray-200 rounded" />
          <div className="h-4 w-44 bg-gray-200 rounded" />
          <div className="h-4 w-28 bg-gray-200 rounded" />
          <div className="h-5 w-16 bg-gray-200 rounded-full" />
          <div className="h-4 w-16 bg-gray-200 rounded" />
          <div className="h-4 w-24 bg-gray-200 rounded" />
          <div className="h-4 w-24 bg-gray-200 rounded" />
          <div className="h-8 w-20 bg-gray-200 rounded-lg" />
        </div>
      ))}
    </div>

    {/* Mobile skeleton */}
    <div className="md:hidden space-y-3 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-gray-200 p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="h-4 w-32 bg-gray-200 rounded" />
            <div className="h-5 w-16 bg-gray-200 rounded-full" />
          </div>
          <div className="h-3 w-48 bg-gray-200 rounded" />
          <div className="h-3 w-28 bg-gray-200 rounded" />
          <div className="flex gap-2">
            <div className="h-8 w-20 bg-gray-200 rounded-lg" />
            <div className="h-8 w-28 bg-gray-200 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  </>
);

/* ------------------------------------------------------------------ */
/*  Activity Log (inline, used in both table & cards)                  */
/* ------------------------------------------------------------------ */
const ActivityLog = ({ logs, loading }) => {
  if (loading) {
    return (
      <div className="animate-pulse space-y-2 py-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="h-3 w-28 bg-gray-200 rounded" />
            <div className="h-3 w-24 bg-gray-200 rounded" />
            <div className="h-3 w-20 bg-gray-200 rounded" />
            <div className="h-3 w-24 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <p className="text-sm text-gray-400 py-3">No activity recorded.</p>
    );
  }

  return (
    <div className="py-3">
      {/* Desktop mini-table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-gray-200 text-gray-500">
              <th className="pb-2 pr-4 font-medium">Timestamp</th>
              <th className="pb-2 pr-4 font-medium">Event</th>
              <th className="pb-2 pr-4 font-medium">Entity</th>
              <th className="pb-2 font-medium">IP</th>
            </tr>
          </thead>
          <tbody className="text-gray-600">
            {logs.map((log) => (
              <tr
                key={log._id}
                className="border-b border-gray-50 last:border-0"
              >
                <td className="py-1.5 pr-4 whitespace-nowrap">
                  {formatDateTime(log.createdAt)}
                </td>
                <td className="py-1.5 pr-4 font-medium text-gray-700">
                  {log.eventType}
                </td>
                <td className="py-1.5 pr-4">
                  {log.entityType}
                  {log.entityId ? ` #${log.entityId.slice(-6)}` : ''}
                </td>
                <td className="py-1.5 font-mono">{log.ip || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile mini-list */}
      <div className="md:hidden space-y-2">
        {logs.map((log) => (
          <div
            key={log._id}
            className="rounded border border-gray-100 p-2 text-xs space-y-0.5"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">
                {log.eventType}
              </span>
              <span className="text-gray-400">
                {formatDateTime(log.createdAt)}
              </span>
            </div>
            <div className="text-gray-500">
              {log.entityType}
              {log.entityId ? ` #${log.entityId.slice(-6)}` : ''}{' '}
              {log.ip && (
                <span className="font-mono text-gray-400">· {log.ip}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Block / Unblock Button                                             */
/* ------------------------------------------------------------------ */
const ToggleStatusButton = ({ user, busy, onToggle }) => {
  const isActive = user.status === 'active';

  return (
    <button
      disabled={busy}
      onClick={() => onToggle(user)}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        isActive
          ? 'bg-red-50 text-red-700 hover:bg-red-100'
          : 'bg-green-50 text-green-700 hover:bg-green-100'
      }`}
    >
      {busy ? (
        <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : isActive ? (
        <FiSlash className="h-3.5 w-3.5" />
      ) : (
        <FiCheck className="h-3.5 w-3.5" />
      )}
      {isActive ? 'Block' : 'Unblock'}
    </button>
  );
};

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
export default function AdminUsers() {
  /* ---------- state ---------- */
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // keyed by user _id → { logs, loading }
  const [expanded, setExpanded] = useState({});
  // cache fetched activity so re-expanding doesn't re-fetch
  const [activityCache, setActivityCache] = useState({});
  // per-user busy flag while toggling status
  const [busyMap, setBusyMap] = useState({});

  /* ---------- debounce search ---------- */
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1); // reset to page 1 on new search
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  /* ---------- fetch users ---------- */
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: PAGE_LIMIT };
      if (debouncedSearch) params.q = debouncedSearch;

      const { data } = await api.get('/admin/users', { params });
      setUsers(data.data?.items ?? []);
      setPagination(data.meta?.pagination ?? null);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Failed to load users';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  /* ---------- toggle expand / fetch activity ---------- */
  const handleToggleExpand = useCallback(
    async (userId) => {
      // collapse if already open
      if (expanded[userId]) {
        setExpanded((prev) => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
        return;
      }

      // if cached, expand immediately without re-fetching
      if (activityCache[userId]) {
        setExpanded((prev) => ({
          ...prev,
          [userId]: { logs: activityCache[userId], loading: false },
        }));
        return;
      }

      // show loading, then fetch
      setExpanded((prev) => ({
        ...prev,
        [userId]: { logs: [], loading: true },
      }));

      try {
        const { data } = await api.get(`/admin/users/${userId}/activity`);
        const logs = data.data?.auditLogs ?? [];
        setActivityCache((prev) => ({ ...prev, [userId]: logs }));
        setExpanded((prev) => ({
          ...prev,
          [userId]: { logs, loading: false },
        }));
      } catch (err) {
        const message =
          err.response?.data?.message ||
          err.message ||
          'Failed to load activity';
        toast.error(message);
        setExpanded((prev) => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
      }
    },
    [expanded, activityCache],
  );

  /* ---------- block / unblock ---------- */
  const handleToggleStatus = useCallback(
    async (user) => {
      const isActive = user.status === 'active';
      const newStatus = isActive ? 'blocked' : 'active';

      // confirm before blocking
      if (isActive) {
        const confirmed = window.confirm(
          `Block this user?\n\n${user.name} (${user.email}) will no longer be able to access their account.`,
        );
        if (!confirmed) return;
      }

      setBusyMap((prev) => ({ ...prev, [user._id]: true }));

      try {
        const { data } = await api.patch(`/admin/users/${user._id}`, {
          status: newStatus,
        });

        const updatedUser = data.data ?? { ...user, status: newStatus };

        // update in local list
        setUsers((prev) =>
          prev.map((u) => (u._id === user._id ? { ...u, ...updatedUser } : u)),
        );

        toast.success(
          `${user.name} has been ${newStatus === 'blocked' ? 'blocked' : 'unblocked'}.`,
        );
      } catch (err) {
        const message =
          err.response?.data?.message ||
          err.message ||
          'Failed to update user status';
        toast.error(message);
      } finally {
        setBusyMap((prev) => ({ ...prev, [user._id]: false }));
      }
    },
    [],
  );

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  const hasNext = pagination
    ? page < Math.ceil((pagination.total ?? 0) / PAGE_LIMIT)
    : false;
  const hasPrev = page > 1;
  const totalPages = pagination
    ? Math.ceil((pagination.total ?? 0) / PAGE_LIMIT)
    : 1;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* ---- Header ---- */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage customer accounts, view activity, and control access.
        </p>
      </div>

      {/* ---- Search bar ---- */}
      <div className="relative max-w-md">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email or phone…"
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
        />
      </div>

      {/* ---- Content area ---- */}
      <div className="bg-white rounded-xl shadow-sm">
        {loading ? (
          <div className="p-6">
            <SkeletonRows />
          </div>
        ) : users.length === 0 ? (
          /* ---- Empty state ---- */
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <FiShield className="h-14 w-14 text-gray-300 mb-4" />
            <h2 className="text-lg font-semibold text-gray-700">
              No users found
            </h2>
            <p className="text-sm text-gray-400 mt-1 max-w-xs">
              {debouncedSearch
                ? `No results for "${debouncedSearch}". Try a different search term.`
                : 'There are no registered users yet.'}
            </p>
          </div>
        ) : (
          <>
            {/* ============================================================ */}
            {/*  Desktop Table (md+)                                         */}
            {/* ============================================================ */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200 text-sm text-gray-500">
                    <th className="px-6 pb-3 pt-5 font-medium">Name</th>
                    <th className="px-4 pb-3 pt-5 font-medium">Email</th>
                    <th className="px-4 pb-3 pt-5 font-medium">Phone</th>
                    <th className="px-4 pb-3 pt-5 font-medium">Status</th>
                    <th className="px-4 pb-3 pt-5 font-medium">Role</th>
                    <th className="px-4 pb-3 pt-5 font-medium">Joined</th>
                    <th className="px-4 pb-3 pt-5 font-medium">Last Login</th>
                    <th className="px-4 pb-3 pt-5 font-medium text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="text-sm text-gray-700">
                  {users.map((user) => {
                    const isExpanded = !!expanded[user._id];
                    const activity = expanded[user._id];

                    return (
                      <UserTableRow
                        key={user._id}
                        user={user}
                        isExpanded={isExpanded}
                        activity={activity}
                        busy={!!busyMap[user._id]}
                        onToggleExpand={handleToggleExpand}
                        onToggleStatus={handleToggleStatus}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ============================================================ */}
            {/*  Mobile Cards                                                */}
            {/* ============================================================ */}
            <div className="md:hidden divide-y divide-gray-100">
              {users.map((user) => {
                const isExpanded = !!expanded[user._id];
                const activity = expanded[user._id];

                return (
                  <UserCard
                    key={user._id}
                    user={user}
                    isExpanded={isExpanded}
                    activity={activity}
                    busy={!!busyMap[user._id]}
                    onToggleExpand={handleToggleExpand}
                    onToggleStatus={handleToggleStatus}
                  />
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ---- Pagination ---- */}
      {!loading && users.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages}
            {pagination?.total != null && (
              <span className="ml-1">
                ({pagination.total.toLocaleString('en-IN')}{' '}
                {pagination.total === 1 ? 'user' : 'users'})
              </span>
            )}
          </p>

          <div className="flex gap-2">
            <button
              disabled={!hasPrev}
              onClick={() => setPage((p) => p - 1)}
              className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              disabled={!hasNext}
              onClick={() => setPage((p) => p + 1)}
              className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Desktop Table Row (extracted for clarity)                          */
/* ------------------------------------------------------------------ */
function UserTableRow({
  user,
  isExpanded,
  activity,
  busy,
  onToggleExpand,
  onToggleStatus,
}) {
  const ExpandIcon = isExpanded ? FiChevronUp : FiChevronDown;

  return (
    <>
      <tr className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
        <td className="px-6 py-3 font-medium text-gray-900 whitespace-nowrap">
          {user.name}
        </td>
        <td className="px-4 py-3 whitespace-nowrap">{user.email}</td>
        <td className="px-4 py-3 whitespace-nowrap">
          {user.phone || '—'}
        </td>
        <td className="px-4 py-3">
          <StatusBadge status={user.status} />
        </td>
        <td className="px-4 py-3 capitalize">{user.role}</td>
        <td className="px-4 py-3 whitespace-nowrap">
          {formatDate(user.createdAt)}
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
          {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}
        </td>
        <td className="px-4 py-3 text-right whitespace-nowrap">
          <div className="inline-flex items-center gap-2">
            <ToggleStatusButton
              user={user}
              busy={busy}
              onToggle={onToggleStatus}
            />
            <button
              onClick={() => onToggleExpand(user._id)}
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              title="View Activity"
            >
              <ExpandIcon className="h-4 w-4" />
            </button>
          </div>
        </td>
      </tr>

      {/* Expanded activity row */}
      {isExpanded && activity && (
        <tr className="bg-gray-50/70">
          <td colSpan={8} className="px-6 pb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Activity Log
            </p>
            <ActivityLog logs={activity.logs} loading={activity.loading} />
          </td>
        </tr>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Mobile Card                                                        */
/* ------------------------------------------------------------------ */
function UserCard({
  user,
  isExpanded,
  activity,
  busy,
  onToggleExpand,
  onToggleStatus,
}) {
  return (
    <div className="p-4 space-y-3">
      {/* Row 1: Name + Status */}
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-gray-900 truncate">{user.name}</span>
        <StatusBadge status={user.status} />
      </div>

      {/* Row 2: Details */}
      <div className="text-sm text-gray-600 space-y-0.5">
        <p>{user.email}</p>
        {user.phone && <p>{user.phone}</p>}
        <p className="text-xs text-gray-400">
          <span className="capitalize">{user.role}</span> · Joined{' '}
          {formatDate(user.createdAt)}
          {user.lastLoginAt
            ? ` · Last login ${formatDate(user.lastLoginAt)}`
            : ' · Never logged in'}
        </p>
      </div>

      {/* Row 3: Actions */}
      <div className="flex items-center gap-2 pt-1">
        <ToggleStatusButton
          user={user}
          busy={busy}
          onToggle={onToggleStatus}
        />
        <button
          onClick={() => onToggleExpand(user._id)}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          {isExpanded ? (
            <>
              <FiChevronUp className="h-3.5 w-3.5" /> Hide Activity
            </>
          ) : (
            <>
              <FiChevronDown className="h-3.5 w-3.5" /> View Activity
            </>
          )}
        </button>
      </div>

      {/* Expanded activity */}
      {isExpanded && activity && (
        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Activity Log
          </p>
          <ActivityLog logs={activity.logs} loading={activity.loading} />
        </div>
      )}
    </div>
  );
}
