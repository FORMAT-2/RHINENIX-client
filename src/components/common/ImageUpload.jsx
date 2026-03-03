import { useState, useRef, useCallback } from "react";
import { FiUploadCloud, FiX, FiImage } from "react-icons/fi";
import toast from "react-hot-toast";
import api from "../../utils/api";

/* ── Constants ────────────────────────────────────────────────── */
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];

/* ── Helpers ──────────────────────────────────────────────────── */
const normalizeValue = (value, multiple) => {
  if (multiple) {
    if (Array.isArray(value)) return value;
    if (typeof value === "string" && value) return [value];
    return [];
  }
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.length) return value[0];
  return "";
};

const validateFile = (file) => {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    toast.error(`"${file.name}" is not a supported image type`);
    return false;
  }
  if (file.size > MAX_SIZE_BYTES) {
    toast.error(`"${file.name}" exceeds the 5 MB size limit`);
    return false;
  }
  return true;
};

/* ── Thumbnail ────────────────────────────────────────────────── */
const Thumbnail = ({ url, onRemove, isLoading }) => (
  <div className="group relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200">
    <img src={url} alt="" className="h-full w-full object-cover" />

    {/* loading overlay */}
    {isLoading && (
      <div className="absolute inset-0 flex items-center justify-center bg-white/60">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    )}

    {/* remove button */}
    {!isLoading && (
      <button
        type="button"
        onClick={onRemove}
        className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 shadow transition-opacity group-hover:opacity-100 focus:opacity-100"
        aria-label="Remove image"
      >
        <FiX size={12} />
      </button>
    )}
  </div>
);

/* ══════════════════════════════════════════════════════════════════
   ImageUpload
   Reusable image upload component with drag-and-drop, preview
   thumbnails, progress states, and server-side cleanup on remove.
   ══════════════════════════════════════════════════════════════════ */
export default function ImageUpload({
  value,
  onChange,
  multiple = false,
  maxFiles = 8,
  label = "Image",
  hint = "",
  className = "",
}) {
  /* ── State ────────────────────────────────────────────────────── */
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);       // tracks active upload batch
  const [removing, setRemoving] = useState(new Set());      // urls currently being deleted
  const inputRef = useRef(null);

  const urls = normalizeValue(value, multiple);

  /* ── Derived helpers ──────────────────────────────────────────── */
  const hasImage = multiple ? urls.length > 0 : !!urls;
  const canAddMore = multiple ? urls.length < maxFiles : !urls;

  /* ── Upload logic ─────────────────────────────────────────────── */
  const uploadFiles = useCallback(
    async (files) => {
      if (!files.length) return;

      // --- client-side validation ---
      const valid = files.filter(validateFile);
      if (!valid.length) return;

      // --- capacity check (multiple) ---
      if (multiple) {
        const remaining = maxFiles - urls.length;
        if (remaining <= 0) {
          toast.error(`Maximum of ${maxFiles} images reached`);
          return;
        }
        if (valid.length > remaining) {
          toast.error(`Only ${remaining} more image${remaining > 1 ? "s" : ""} allowed`);
          valid.splice(remaining);
        }
      } else if (valid.length > 1) {
        valid.splice(1); // single mode — keep first file only
      }

      setUploading(true);

      try {
        if (multiple) {
          /* ── Multi-file upload ─────────────────────────────── */
          const form = new FormData();
          valid.forEach((f) => form.append("images", f));
          const { data } = await api.post("/admin/upload/multiple", form, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          const newUrls = data?.data?.urls ?? [];
          if (!newUrls.length) throw new Error("Upload returned no URLs");
          onChange([...urls, ...newUrls]);
        } else {
          /* ── Single-file upload ────────────────────────────── */
          const form = new FormData();
          form.append("image", valid[0]);
          const { data } = await api.post("/admin/upload", form, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          const newUrl = data?.data?.url;
          if (!newUrl) throw new Error("Upload returned no URL");
          onChange(newUrl);
        }
      } catch (err) {
        const msg =
          err?.response?.data?.message || err.message || "Image upload failed";
        toast.error(msg);
      } finally {
        setUploading(false);
      }
    },
    [multiple, maxFiles, urls, onChange],
  );

  /* ── Remove logic ─────────────────────────────────────────────── */
  const handleRemove = useCallback(
    async (urlToRemove) => {
      setRemoving((prev) => new Set(prev).add(urlToRemove));

      try {
        await api.delete("/admin/upload", { data: { url: urlToRemove } });
      } catch {
        // Blob may already be gone — still remove from UI
      }

      if (multiple) {
        onChange(urls.filter((u) => u !== urlToRemove));
      } else {
        onChange("");
      }

      setRemoving((prev) => {
        const next = new Set(prev);
        next.delete(urlToRemove);
        return next;
      });
    },
    [multiple, urls, onChange],
  );

  /* ── Event handlers ───────────────────────────────────────────── */
  const handleClick = () => inputRef.current?.click();

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    uploadFiles(files);
    e.target.value = ""; // allow re-selecting the same file
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files || []);
    uploadFiles(files);
  };

  /* ── Render ───────────────────────────────────────────────────── */
  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* ── Label / Hint ──────────────────────────────────────── */}
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}

      {/* ── Main area ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* ── Existing thumbnails ─────────────────────────────── */}
        {multiple &&
          urls.map((url) => (
            <Thumbnail
              key={url}
              url={url}
              isLoading={removing.has(url)}
              onRemove={() => handleRemove(url)}
            />
          ))}

        {!multiple && hasImage && (
          <Thumbnail
            url={urls}
            isLoading={removing.has(urls)}
            onRemove={() => handleRemove(urls)}
          />
        )}

        {/* ── Uploading placeholder ───────────────────────────── */}
        {uploading && (
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg border border-dashed border-primary-300 bg-primary-50">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
          </div>
        )}

        {/* ── Drop zone / Add more ────────────────────────────── */}
        {canAddMore && !uploading && (
          <button
            type="button"
            onClick={handleClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex flex-1 min-w-[120px] cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-3 transition-colors ${
              dragActive
                ? "border-primary-400 bg-primary-50 text-primary-600"
                : "border-gray-300 bg-white text-gray-400 hover:border-primary-300 hover:text-primary-500"
            } ${hasImage ? "h-16 min-w-0 flex-none w-16" : "h-24"}`}
            aria-label={hasImage ? "Add more images" : "Upload image"}
          >
            {hasImage ? (
              <FiUploadCloud size={20} />
            ) : (
              <span className="flex flex-col items-center gap-1 text-center">
                <FiUploadCloud size={22} />
                <span className="text-xs leading-tight">
                  Click or drag to upload
                </span>
              </span>
            )}
          </button>
        )}

        {/* ── Hidden input ────────────────────────────────────── */}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* ── File count indicator (multiple) ───────────────────── */}
      {multiple && urls.length > 0 && (
        <p className="flex items-center gap-1 text-xs text-gray-400">
          <FiImage size={12} />
          {urls.length} / {maxFiles} images
        </p>
      )}
    </div>
  );
}
