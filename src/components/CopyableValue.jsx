import { useState, useCallback } from "react";

async function copyToClipboard(text) {
  if (!text) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

function IconCopy({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
}

function IconCheck({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

/**
 * Shows content with a copy control. Copies `value` as text; optional `children` for display.
 * Use `buttonOnly` for a standalone copy icon (e.g. next to a link that already shows the value).
 */
export default function CopyableValue({
  value,
  children,
  className = "",
  copyLabel = "Copy",
  compact = false,
  buttonOnly = false,
}) {
  const [copied, setCopied] = useState(false);
  const text = value != null && value !== "" ? String(value) : "";

  const handleCopy = useCallback(
    async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const ok = await copyToClipboard(text);
      if (ok) {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      }
    },
    [text],
  );

  if (!text) {
    if (buttonOnly) return null;
    return children != null ? (
      <span className={className}>{children}</span>
    ) : (
      <span className={className}>—</span>
    );
  }

  const btnClass = compact
    ? "inline-flex shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-200/80 hover:text-delivery-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-delivery-500/40"
    : "inline-flex shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-delivery-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-delivery-500/40";

  if (buttonOnly) {
    return (
      <button
        type="button"
        onClick={handleCopy}
        className={`${btnClass} ${className}`.trim()}
        aria-label={copied ? "Copied to clipboard" : `${copyLabel}: ${text}`}
        title={copied ? "Copied!" : copyLabel}
      >
        {copied ? (
          <IconCheck className="size-3.5 text-emerald-600" />
        ) : (
          <IconCopy className="size-3.5" />
        )}
      </button>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 ${className}`.trim()}>
      {children != null ? children : (
        <span className="tabular-nums">{text}</span>
      )}
      <button
        type="button"
        onClick={handleCopy}
        className={btnClass}
        aria-label={copied ? "Copied to clipboard" : `${copyLabel}: ${text}`}
        title={copied ? "Copied!" : copyLabel}
      >
        {copied ? (
          compact ? (
            <IconCheck className="size-3.5 text-emerald-600" />
          ) : (
            <span className="px-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-600">
              Copied
            </span>
          )
        ) : (
          <IconCopy className={compact ? "size-3.5" : "size-4"} />
        )}
      </button>
    </span>
  );
}
