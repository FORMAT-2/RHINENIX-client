import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiAlertCircle } from 'react-icons/fi';
import api from '../utils/api';

/* ═══════════════════════════════════════════════════════════════════
   SKELETON
   ═══════════════════════════════════════════════════════════════════ */
const Sk = ({ className = '' }) => (
  <div className={`animate-pulse rounded-lg bg-gray-200 ${className}`} />
);

function PolicySkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Sk className="mb-6 h-8 w-64" />
      <div className="space-y-3">
        <Sk className="h-4 w-full" />
        <Sk className="h-4 w-full" />
        <Sk className="h-4 w-5/6" />
        <Sk className="h-4 w-full" />
        <Sk className="h-4 w-3/4" />
        <Sk className="h-4 w-full" />
        <Sk className="h-4 w-2/3" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   POLICY PAGE
   ═══════════════════════════════════════════════════════════════════ */
export default function PolicyPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    setPolicy(null);

    api
      .get(`/policies/${slug}`)
      .then(({ data }) => setPolicy(data.data))
      .catch((err) => {
        const status = err.response?.status;
        if (status === 404) {
          setError('Policy not found. It may have been removed or is not available.');
        } else {
          setError(err.response?.data?.message || 'Failed to load policy');
        }
      })
      .finally(() => setLoading(false));
  }, [slug]);

  /* ── Loading ────────────────────────────────────────────────── */
  if (loading) return <PolicySkeleton />;

  /* ── Error / 404 ────────────────────────────────────────────── */
  if (error || !policy) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
          <FiAlertCircle className="h-8 w-8 text-amber-500" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-gray-900">
          {error || 'Policy not found'}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-600"
        >
          <FiArrowLeft className="h-4 w-4" />
          Go Back
        </button>
      </div>
    );
  }

  /* ── Success ────────────────────────────────────────────────── */
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 pb-24 lg:pb-6">
      {/* Back button */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 transition hover:text-primary-600"
      >
        <FiArrowLeft className="h-4 w-4" />
        Back
      </button>

      {/* Title */}
      <h1 className="mb-6 text-2xl font-bold text-gray-900 sm:text-3xl">
        {policy.title}
      </h1>

      {/* Last updated */}
      {policy.updatedAt && (
        <p className="mb-6 text-xs text-gray-400">
          Last updated:{' '}
          {new Date(policy.updatedAt).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
          {policy.version ? ` · v${policy.version}` : ''}
        </p>
      )}

      {/* Content – rendered safely via dangerouslySetInnerHTML */}
      <article
        className="
          prose prose-sm sm:prose max-w-none
          prose-headings:text-gray-900 prose-headings:font-semibold
          prose-p:text-gray-700 prose-p:leading-relaxed
          prose-a:text-primary-600 prose-a:no-underline hover:prose-a:underline
          prose-strong:text-gray-900
          prose-ul:text-gray-700 prose-ol:text-gray-700
          prose-li:marker:text-gray-400
          prose-hr:border-gray-200
        "
        dangerouslySetInnerHTML={{ __html: policy.htmlContent || '' }}
      />
    </div>
  );
}
