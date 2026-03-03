import { useState, useEffect } from 'react';
import { FiSave, FiSun, FiMoon } from 'react-icons/fi';
import api from '../../utils/api';
import toast from 'react-hot-toast';

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */
const DECORATION_OPTIONS = [
  { value: 'diwali',    label: 'Diwali'     },
  { value: 'christmas', label: 'Christmas'  },
  { value: 'newyear',   label: 'New Year'   },
  { value: 'holi',      label: 'Holi'       },
  { value: 'custom',    label: 'Custom'     },
];

const DEFAULT_FESTIVAL = {
  isFestivalThemeEnabled: false,
  festivalTheme: {
    primaryColor:  '#6366f1',
    accentColor:   '#f59e0b',
    bannerText:    '',
    decorationType: 'custom',
  },
  effectiveFrom: '',
  effectiveTo:   '',
};

/* ------------------------------------------------------------------ */
/*  Skeleton – Loading State                                          */
/* ------------------------------------------------------------------ */
const Sk = ({ className = '' }) => (
  <div className={`animate-pulse rounded-lg bg-gray-200 ${className}`} />
);

const SkeletonCards = () => (
  <div className="space-y-8 p-4 sm:p-6 lg:p-8">
    {/* Header skeleton */}
    <div>
      <Sk className="h-7 w-48" />
      <Sk className="mt-2 h-4 w-72" />
    </div>

    {/* Festival card skeleton */}
    <div className="rounded-xl bg-white p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between">
        <Sk className="h-5 w-36" />
        <Sk className="h-7 w-14 rounded-full" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Sk className="h-4 w-24" />
            <Sk className="h-10 w-full" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Sk className="h-4 w-28" />
          <Sk className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Sk className="h-4 w-28" />
          <Sk className="h-10 w-full" />
        </div>
      </div>
    </div>

    {/* Shipping card skeleton */}
    <div className="rounded-xl bg-white p-6 shadow-sm space-y-4">
      <Sk className="h-5 w-40" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Sk className="h-28 w-full rounded-xl" />
        <Sk className="h-28 w-full rounded-xl" />
      </div>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Toggle Switch                                                     */
/* ------------------------------------------------------------------ */
function Toggle({ enabled, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className="group flex items-center gap-3"
    >
      <span
        className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ${
          enabled ? 'bg-indigo-600' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            enabled ? 'translate-x-8' : 'translate-x-1'
          }`}
        />
      </span>
      {label && (
        <span className="text-sm font-medium text-gray-700">{label}</span>
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Color Picker Field                                                */
/* ------------------------------------------------------------------ */
function ColorField({ label, value, onChange }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 cursor-pointer rounded-lg border border-gray-300 p-1"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={7}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-mono text-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Festival Theme Preview                                            */
/* ------------------------------------------------------------------ */
function ThemePreview({ primaryColor, accentColor, bannerText }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">Preview</label>
      <div
        className="overflow-hidden rounded-xl border border-gray-200"
        style={{ background: primaryColor }}
      >
        {/* Simulated banner */}
        <div
          className="px-4 py-2.5 text-center text-sm font-semibold"
          style={{ background: accentColor, color: primaryColor }}
        >
          {bannerText || 'Your banner text will appear here'}
        </div>

        {/* Simulated content */}
        <div className="p-4 space-y-2">
          <div
            className="h-3 w-3/4 rounded"
            style={{ background: accentColor, opacity: 0.6 }}
          />
          <div
            className="h-3 w-1/2 rounded"
            style={{ background: accentColor, opacity: 0.4 }}
          />
          <div className="mt-3 flex gap-2">
            <div
              className="rounded-md px-3 py-1.5 text-xs font-semibold"
              style={{ background: accentColor, color: primaryColor }}
            >
              Shop Now
            </div>
            <div
              className="rounded-md border px-3 py-1.5 text-xs font-semibold"
              style={{ borderColor: accentColor, color: accentColor }}
            >
              Explore
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Shipping Mode Card                                                */
/* ------------------------------------------------------------------ */
function ShippingCard({ mode, selected, onClick, icon: Icon, title, description }) {
  const isActive = selected === mode;
  return (
    <button
      type="button"
      onClick={() => onClick(mode)}
      className={`flex w-full flex-col items-start gap-3 rounded-xl border-2 p-5 text-left transition-all duration-200 ${
        isActive
          ? 'border-indigo-500 bg-indigo-50 shadow-sm'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
            isActive
              ? 'bg-indigo-100 text-indigo-600'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p
            className={`text-sm font-semibold ${
              isActive ? 'text-indigo-900' : 'text-gray-900'
            }`}
          >
            {title}
          </p>
        </div>
      </div>
      <p
        className={`text-sm leading-relaxed ${
          isActive ? 'text-indigo-700' : 'text-gray-500'
        }`}
      >
        {description}
      </p>

      {/* Radio indicator */}
      <div className="flex items-center gap-2 mt-1">
        <span
          className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${
            isActive ? 'border-indigo-600' : 'border-gray-300'
          }`}
        >
          {isActive && (
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" />
          )}
        </span>
        <span
          className={`text-xs font-medium ${
            isActive ? 'text-indigo-600' : 'text-gray-400'
          }`}
        >
          {isActive ? 'Selected' : 'Select'}
        </span>
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                    */
/* ------------------------------------------------------------------ */
export default function AdminTheme() {
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [festival, setFestival]     = useState(DEFAULT_FESTIVAL);
  const [shippingMode, setShippingMode] = useState('manual');

  /* ---- Fetch both settings on mount ---- */
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [themeRes, shippingRes] = await Promise.all([
          api.get('/theme'),
          api.get('/admin/settings/shipping-mode'),
        ]);

        const t = themeRes.data.data;
        setFestival({
          isFestivalThemeEnabled: t.isFestivalThemeEnabled ?? false,
          festivalTheme: {
            primaryColor:   t.festivalTheme?.primaryColor  || DEFAULT_FESTIVAL.festivalTheme.primaryColor,
            accentColor:    t.festivalTheme?.accentColor   || DEFAULT_FESTIVAL.festivalTheme.accentColor,
            bannerText:     t.festivalTheme?.bannerText    || '',
            decorationType: t.festivalTheme?.decorationType || 'custom',
          },
          effectiveFrom: t.effectiveFrom
            ? toLocalDatetime(t.effectiveFrom)
            : '',
          effectiveTo: t.effectiveTo
            ? toLocalDatetime(t.effectiveTo)
            : '',
        });

        setShippingMode(shippingRes.data.data?.mode || 'manual');
      } catch (err) {
        toast.error(
          err.response?.data?.message || err.message || 'Failed to load settings',
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  /* ---- Save both settings ---- */
  const handleSave = async () => {
    setSaving(true);
    try {
      const festivalPayload = {
        isFestivalThemeEnabled: festival.isFestivalThemeEnabled,
        festivalTheme: { ...festival.festivalTheme },
        effectiveFrom: festival.effectiveFrom
          ? new Date(festival.effectiveFrom).toISOString()
          : null,
        effectiveTo: festival.effectiveTo
          ? new Date(festival.effectiveTo).toISOString()
          : null,
      };

      await Promise.all([
        api.patch('/admin/theme/festival-toggle', festivalPayload),
        api.patch('/admin/settings/shipping-mode', { mode: shippingMode }),
      ]);

      toast.success('Settings saved successfully');
    } catch (err) {
      toast.error(
        err.response?.data?.message || err.message || 'Failed to save settings',
      );
    } finally {
      setSaving(false);
    }
  };

  /* ---- Festival field updaters ---- */
  const updateThemeField = (field, value) => {
    setFestival((prev) => ({
      ...prev,
      festivalTheme: { ...prev.festivalTheme, [field]: value },
    }));
  };

  const updateFestivalField = (field, value) => {
    setFestival((prev) => ({ ...prev, [field]: value }));
  };

  /* ---- Loading state ---- */
  if (loading) return <SkeletonCards />;

  /* ---- Render ---- */
  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      {/* ============================================================ */}
      {/*  Header                                                      */}
      {/* ============================================================ */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Theme Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage festival themes and shipping configuration for your store.
        </p>
      </div>

      {/* ============================================================ */}
      {/*  Section 1 – Festival Theme                                  */}
      {/* ============================================================ */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        {/* ---- Toggle ---- */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Festival Theme
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">
              Enable a seasonal or festive look for your storefront.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                festival.isFestivalThemeEnabled
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {festival.isFestivalThemeEnabled ? (
                <>
                  <FiSun className="h-3 w-3" /> Enabled
                </>
              ) : (
                <>
                  <FiMoon className="h-3 w-3" /> Disabled
                </>
              )}
            </span>
            <Toggle
              enabled={festival.isFestivalThemeEnabled}
              onChange={(v) => updateFestivalField('isFestivalThemeEnabled', v)}
            />
          </div>
        </div>

        {/* ---- Festival settings (only when enabled) ---- */}
        {festival.isFestivalThemeEnabled && (
          <div className="mt-6 space-y-6 animate-in fade-in">
            {/* Colors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <ColorField
                label="Primary Color"
                value={festival.festivalTheme.primaryColor}
                onChange={(v) => updateThemeField('primaryColor', v)}
              />
              <ColorField
                label="Accent Color"
                value={festival.festivalTheme.accentColor}
                onChange={(v) => updateThemeField('accentColor', v)}
              />
            </div>

            {/* Banner text + Decoration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Banner Text
                </label>
                <input
                  type="text"
                  value={festival.festivalTheme.bannerText}
                  onChange={(e) => updateThemeField('bannerText', e.target.value)}
                  placeholder="🎉 Big Festive Sale — Up to 50% Off!"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Decoration Type
                </label>
                <select
                  value={festival.festivalTheme.decorationType}
                  onChange={(e) =>
                    updateThemeField('decorationType', e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors bg-white"
                >
                  {DECORATION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Effective dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Effective From
                </label>
                <input
                  type="datetime-local"
                  value={festival.effectiveFrom}
                  onChange={(e) =>
                    updateFestivalField('effectiveFrom', e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Effective To
                </label>
                <input
                  type="datetime-local"
                  value={festival.effectiveTo}
                  onChange={(e) =>
                    updateFestivalField('effectiveTo', e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors"
                />
              </div>
            </div>

            {/* Preview */}
            <ThemePreview
              primaryColor={festival.festivalTheme.primaryColor}
              accentColor={festival.festivalTheme.accentColor}
              bannerText={festival.festivalTheme.bannerText}
            />
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/*  Section 2 – Shipping Mode                                   */}
      {/* ============================================================ */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="pb-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Shipping Mode</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Choose how order shipments are processed.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ShippingCard
            mode="manual"
            selected={shippingMode}
            onClick={setShippingMode}
            icon={FiSun}
            title="Manual Shipping"
            description="Admin manually marks orders as shipped. Best when you need full control over every shipment."
          />
          <ShippingCard
            mode="automatic"
            selected={shippingMode}
            onClick={setShippingMode}
            icon={FiMoon}
            title="Automatic Shipping"
            description="System automatically processes shipping after order confirmation. Ideal for high-volume stores."
          />
        </div>
      </div>

      {/* ============================================================ */}
      {/*  Save Button                                                 */}
      {/* ============================================================ */}
      <div className="sticky bottom-0 -mx-4 sm:-mx-6 lg:-mx-8 bg-gray-50/80 backdrop-blur-sm border-t border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Saving…
              </>
            ) : (
              <>
                <FiSave className="h-4 w-4" />
                Save All Settings
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

/**
 * Convert an ISO string (e.g. from the API) to the value format
 * expected by <input type="datetime-local"> → "YYYY-MM-DDThh:mm"
 */
function toLocalDatetime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
