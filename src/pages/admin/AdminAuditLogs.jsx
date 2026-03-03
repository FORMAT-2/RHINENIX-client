import { useState, useEffect } from 'react';
import { FiFilter, FiChevronLeft, FiChevronRight, FiClock } from 'react-icons/fi';
import api from '../../utils/api';
import toast from 'react-hot-toast';

// ── Constants ────────────────────────────────────────────────────────────────

const EVENT_TYPE_OPTIONS = [
  { value: '', label: 'All Events' },
  { value: 'user.login', label: 'user.login' },
  { value: 'user.register', label: 'user.register' },
  { value: 'product.created', label: 'product.created' },
  { value: 'product.updated', label: 'product.updated' },
  { value: 'product.deleted', label: 'product.deleted' },
  { value: 'order.created', label: 'order.created' },
  { value: 'order.statusChanged', label: 'order.statusChanged' },
  { value: 'category.created', label: 'category.created' },
  { value: 'category.updated', label: 'category.updated' },
  { value: 'category.deleted', label: 'category.deleted' },
];

const ENTITY_TYPE_OPTIONS = [
  { value: '', label: 'All Entities' },
  { value: 'user', label: 'User' },
  { value: 'product', label: 'Product' },
  { value: 'order', label: 'Order' },
  { value: 'category', label: 'Category' },
  { value: 'discount', label: 'Discount' },
  { value: 'banner', label: 'Banner' },
  { value: 'policy', label: 'Policy' },
];

const BADGE_COLORS = {
  user: 'bg-blue-100 text-blue-700',
  product: 'bg-green-100 text-green-700',
  order: 'bg-purple-100 text-purple-700',
  category: 'bg-orange-100 text-orange-700',
};

const LOGS_PER_PAGE = 30;

// ── Helpers ──────────────────────────────────────────────────────────────────

function getBadgeClass(eventType) {
  if (!eventType) return 'bg-gray-100 text-gray-700';
  const prefix = eventType.split('.')[0];
  return BADGE_COLORS[prefix] || 'bg-gray-100 text-gray-700';
}

function formatTimestamp(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }) + ' ' + d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function truncateId(id, len = 10) {
  if (!id) return '—';
  return id.length > len ? id.slice(0, len) + '…' : id;
}

function getActorName(actor) {
  if (!actor) return 'System';
  return actor.name || actor.email || 'Unknown';
}

// ── Skeleton Loaders ─────────────────────────────────────────────────────────

function SkeletonTableRows({ count = 8 }) {
  return Array.from({ length: count }).map((_, i) => (
    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
      {Array.from({ length: 6 }).map((__, j) => (
        <td key={j} className="px-4 py-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
        </td>
      ))}
    </tr>
  ));
}

function SkeletonCards({ count = 4 }) {
  return Array.from({ length: count }).map((_, i) => (
    <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
      <div className="h-3 w-36 bg-gray-200 rounded animate-pulse" />
      <div className="h-5 w-28 bg-gray-200 rounded-full animate-pulse" />
      <div className="space-y-2">
        <div className="h-3 w-40 bg-gray-200 rounded animate-pulse" />
        <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  ));
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalItems: 0 });
  const [loading, setLoading] = useState(true);
  const [eventType, setEventType] = useState('');
  const [entityType, setEntityType] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, eventType, entityType]);

  async function fetchLogs() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: LOGS_PER_PAGE });
      if (eventType) params.append('eventType', eventType);
      if (entityType) params.append('entityType', entityType);

      const res = await api.get(`/admin/audit-logs?${params.toString()}`);
      const logData = res.data.data?.items ?? [];
      const pg = res.data.meta?.pagination;

      setLogs(logData);
      setPagination(pg || { page: 1, totalPages: 1, totalItems: 0 });
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to load audit logs';
      toast.error(message);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }

  function handleFilterChange(setter) {
    return (e) => {
      setter(e.target.value);
      setPage(1);
    };
  }

  const hasLogs = logs.length > 0;
  const showEmpty = !loading && !hasLogs;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        <p className="mt-1 text-sm text-gray-500">Read-only history of system events and user actions.</p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex items-center gap-2 text-gray-500">
          <FiFilter className="w-4 h-4" />
          <span className="text-sm font-medium">Filters</span>
        </div>

        <select
          value={eventType}
          onChange={handleFilterChange(setEventType)}
          className="w-full sm:w-52 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
        >
          {EVENT_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <select
          value={entityType}
          onChange={handleFilterChange(setEntityType)}
          className="w-full sm:w-44 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
        >
          {ENTITY_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Desktop Table (md+) */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Timestamp</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Actor</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Event Type</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Entity Type</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Entity ID</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && <SkeletonTableRows />}

            {!loading && hasLogs && logs.map((log, idx) => (
              <tr key={log._id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                  {formatTimestamp(log.createdAt)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                  {getActorName(log.actorUserId)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${getBadgeClass(log.eventType)}`}>
                    {log.eventType}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-gray-600 capitalize">
                  {log.entityType || '—'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-gray-500" title={log.entityId}>
                  {truncateId(log.entityId)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-gray-500">
                  {log.ip || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {showEmpty && <EmptyState />}
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {loading && <SkeletonCards />}

        {!loading && hasLogs && logs.map((log) => (
          <div key={log._id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm space-y-2">
            <p className="text-xs text-gray-400">{formatTimestamp(log.createdAt)}</p>

            <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${getBadgeClass(log.eventType)}`}>
              {log.eventType}
            </span>

            <div className="text-sm text-gray-700 space-y-1">
              <p><span className="font-medium text-gray-500">Actor:</span> {getActorName(log.actorUserId)}</p>
              <p>
                <span className="font-medium text-gray-500">Entity:</span>{' '}
                <span className="capitalize">{log.entityType || '—'}</span>{' '}
                <span className="font-mono text-xs text-gray-400" title={log.entityId}>{truncateId(log.entityId)}</span>
              </p>
              <p><span className="font-medium text-gray-500">IP:</span> <span className="font-mono text-xs">{log.ip || '—'}</span></p>
            </div>
          </div>
        ))}

        {showEmpty && <EmptyState />}
      </div>

      {/* Pagination */}
      {!loading && hasLogs && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <p className="text-sm text-gray-500">
            Total: <span className="font-medium text-gray-700">{pagination.totalItems}</span> logs
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <FiChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <span className="text-sm text-gray-600">
              Page <span className="font-medium">{pagination.page}</span> of{' '}
              <span className="font-medium">{pagination.totalPages}</span>
            </span>

            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Next
              <FiChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <FiClock className="w-12 h-12 mb-3" />
      <p className="text-lg font-medium">No audit logs found</p>
      <p className="mt-1 text-sm">Try adjusting your filters or check back later.</p>
    </div>
  );
}
