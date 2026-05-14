function customerInitials(displayName) {
  const parts = String(displayName || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "?";
  const first = parts[0];
  const last = parts.length > 1 ? parts[parts.length - 1] : "";
  if (last && first[0] && last[0] && first !== last) {
    return (first[0] + last[0]).toUpperCase();
  }
  return first.slice(0, 2).toUpperCase();
}

function IconPhone({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-1.856-.903-3.256-2.303-4.159-4.159l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
      />
    </svg>
  );
}

function IconMapPin({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
      />
    </svg>
  );
}

function IconSessionId({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H3.75v-2.877a2.25 2.25 0 01.879-1.664L10.5 11.25M15.75 5.25a3 3 0 11-3 3m3.75 0a3 3 0 10-3 3m3.75 0H21" />
    </svg>
  );
}

/**
 * Compact customer block: name, phone, address, UIO/session (shared by admin dashboard + track page).
 */
export default function CustomerDetailsCompact({ order }) {
  const name = order.customer?.name?.trim() || "";
  const displayName = name || "—";
  const phone = order.customer?.phone?.trim() || "";
  const addressRaw = order.customer?.address;
  const address =
    typeof addressRaw === "string" ? addressRaw.trim() : addressRaw || "";
  const uio =
    order.customer?.uio ??
    order.customer?.uid ??
    order.sessionId ??
    "";

  const initials = name ? customerInitials(name) : "?";
  const phoneDigits = phone.replace(/\D/g, "");
  const telHref =
    phoneDigits.length === 10
      ? `tel:+91${phoneDigits}`
      : phoneDigits.length > 10
        ? `tel:+${phoneDigits}`
        : phoneDigits.length > 0
          ? `tel:${phone}`
          : null;

  const uioStr = uio ? String(uio) : "";

  return (
    <div className="relative overflow-hidden rounded-xl border border-delivery-200/90 bg-gradient-to-br from-delivery-50/90 via-white to-amber-50/35 shadow-sm">
      <div
        className="h-1 w-full bg-gradient-to-r from-delivery-500 via-orange-500 to-amber-400"
        aria-hidden
      />
      <div className="p-2.5 sm:p-3">
        <div className="mb-2 flex items-center gap-2.5">
          <div
            className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-delivery-500 to-flame-500 text-[10px] font-bold tracking-tight text-white shadow-sm ring-1 ring-white/80"
            aria-hidden
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="text-[9px] font-bold uppercase tracking-wider text-delivery-700/90">
              Customer
            </p>
            <p className="font-display text-base font-bold text-slate-900 truncate">
              {displayName}
            </p>
          </div>
        </div>
        <dl className="divide-y divide-delivery-100/70 rounded-lg bg-white/70 text-xs ring-1 ring-delivery-100/80">
          <div className="flex items-start gap-2 px-2 py-1.5">
            <IconPhone className="mt-0.5 size-3.5 shrink-0 text-delivery-700" />
            <div className="min-w-0 flex-1">
              <dt className="sr-only">Phone</dt>
              <dd className="text-slate-500">
                <span className="font-semibold text-slate-400">Phone </span>
                {phone ? (
                  telHref ? (
                    <a
                      href={telHref}
                      className="font-semibold text-delivery-900 tabular-nums underline decoration-delivery-300 underline-offset-2 hover:text-delivery-700"
                    >
                      {phone}
                    </a>
                  ) : (
                    <span className="font-semibold text-slate-800 tabular-nums">
                      {phone}
                    </span>
                  )
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </dd>
            </div>
          </div>
          <div className="flex items-start gap-2 px-2 py-1.5">
            <IconMapPin className="mt-0.5 size-3.5 shrink-0 text-amber-700" />
            <div className="min-w-0 flex-1">
              <dt className="sr-only">Address</dt>
              <dd className="text-slate-500">
                <span className="font-semibold text-slate-400">Address </span>
                <span className="whitespace-pre-wrap text-slate-800">
                  {address ? address : <span className="text-slate-400">—</span>}
                </span>
              </dd>
            </div>
          </div>
          {/* <div className="flex items-center gap-2 px-2 py-1.5">
            <IconSessionId className="size-3.5 shrink-0 text-slate-600" />
            <div className="min-w-0 flex-1">
              <dt className="sr-only">Session or UIO</dt>
              <dd className="flex min-w-0 items-baseline gap-1.5">
                <span className="shrink-0 font-semibold text-slate-400">UIO</span>
                {uioStr ? (
                  <code
                    className="min-w-0 flex-1 truncate font-mono text-[11px] text-slate-800"
                    title={uioStr}
                  >
                    {uioStr}
                  </code>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </dd>
            </div>
          </div> */}
        </dl>
      </div>
    </div>
  );
}
