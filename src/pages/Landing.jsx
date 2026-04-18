import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import DishNameBackdrop from '../components/DishNameBackdrop.jsx';

function IconSteps({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );
}

function IconChef({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
      <path d="M7 2v20" />
      <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
    </svg>
  );
}

function IconPulse({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

function DashboardPreview() {
  const rows = [
    { id: '#1042', items: 'Veg noodles · Full', status: 'Cooking', tone: 'bg-amber-100 text-amber-800' },
    { id: '#1041', items: 'Paneer tikka · Half', status: 'Ready', tone: 'bg-emerald-100 text-emerald-800' },
    { id: '#1040', items: 'Momo platter · Full', status: 'New', tone: 'bg-slate-100 text-slate-700' },
  ];
  return (
    <div className="overflow-hidden rounded-[12px] border border-slate-200/90 bg-white shadow-[0_8px_32px_-12px_rgba(15,23,42,0.14)] ring-1 ring-slate-900/[0.04] transition hover:shadow-[0_12px_40px_-14px_rgba(15,23,42,0.16)] xl:rounded-[14px] xl:shadow-[0_16px_48px_-20px_rgba(15,23,42,0.18)]">
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2 xl:px-4 xl:py-2.5">
        <span className="size-2 rounded-full bg-[#ff5f57]" aria-hidden />
        <span className="size-2 rounded-full bg-[#febc2e]" aria-hidden />
        <span className="size-2 rounded-full bg-[#28c840]" aria-hidden />
        <span className="text-[11px] xl:text-xs font-medium text-slate-500 ml-2 tabular-nums">genz — orders</span>
      </div>
      <div className="border-b border-slate-100 px-3 py-2 xl:px-4 flex items-center justify-between gap-2 bg-white">
        <span className="text-xs xl:text-sm font-semibold text-slate-900">Live queue</span>
        <span className="text-[10px] font-medium uppercase tracking-wide text-emerald-600">● syncing</span>
      </div>
      <div className="p-2.5 xl:p-3.5 space-y-1.5 xl:space-y-2 bg-white">
        {rows.map((row) => (
          <div
            key={row.id}
            className="flex items-center justify-between gap-2 rounded-[8px] border border-slate-100 bg-slate-50/50 px-2.5 py-2 xl:px-3 xl:py-2.5"
          >
            <div className="min-w-0">
              <p className="text-[11px] xl:text-xs font-semibold text-slate-900 tabular-nums">{row.id}</p>
              <p className="text-[10px] xl:text-[11px] text-slate-500 truncate">{row.items}</p>
            </div>
            <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] xl:text-[11px] font-semibold ${row.tone}`}>{row.status}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-100 px-3 py-2 xl:px-4 xl:py-2.5 flex items-center justify-between text-[10px] xl:text-xs text-slate-500 bg-slate-50/50">
        <span>Today · 24 orders</span>
        <span className="text-brand-700 font-medium">Avg. prep 12m</span>
      </div>
    </div>
  );
}

/** Fluid column: grows on large / ultra-wide (≤1680px, ~94vw) — minimal empty gutters */
const shell =
  'mx-auto w-full max-w-[min(1680px,94vw)] px-4 sm:px-5 md:px-6 lg:px-7 xl:px-8 2xl:px-10';

function MenuPreviewMini() {
  const dishes = [
    { name: 'Veg noodles', cat: 'Chinese', half: 80, full: 140 },
    { name: 'Paneer tikka', cat: 'Tandoor', half: 140, full: 260 },
  ];
  return (
    <div className="mt-3 rounded-[12px] border border-slate-200/90 bg-white/95 p-3 xl:p-4 shadow-[0_4px_24px_-8px_rgba(15,23,42,0.12)] ring-1 ring-slate-900/[0.04] backdrop-blur-sm xl:rounded-[14px]">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Menu · guest</p>
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
          Live
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 xl:gap-3">
        {dishes.map((row) => (
          <div
            key={row.name}
            className="group flex flex-col overflow-hidden rounded-[10px] border border-slate-100 bg-slate-50/80 shadow-sm ring-1 ring-slate-900/[0.03] transition hover:border-brand-200/60 hover:shadow-md xl:rounded-[12px]"
          >
            <DishNameBackdrop name={row.name} variant="compact" />
            <div className="p-2 xl:p-2.5">
              <p className="text-[10px] font-semibold leading-tight text-slate-900 line-clamp-2">{row.name}</p>
              <p className="mt-0.5 text-[9px] font-medium uppercase tracking-wide text-slate-400">{row.cat}</p>
              <div className="mt-1.5 flex justify-between gap-1 text-[9px] tabular-nums text-slate-600">
                <span>
                  <span className="text-slate-400">H</span> ₹{row.half}
                </span>
                <span>
                  <span className="text-slate-400">F</span> ₹{row.full}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-1">
                <span className="rounded-[6px] border border-slate-200 bg-white py-1 text-center text-[9px] font-semibold text-slate-500">
                  Half
                </span>
                <span className="rounded-[6px] bg-gradient-to-r from-brand-600 to-emerald-600 py-1 text-center text-[9px] font-semibold text-white">
                  Full
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Landing() {
  const { isAdmin } = useAuth();

  return (
    <div className="home-fill w-full overflow-x-hidden text-slate-800">
      <main className="flex w-full min-w-0 flex-1 flex-col">
      {/* Hero — split + glow — page backdrop comes from index.css body::before */}
      <section className="relative overflow-hidden border-b border-slate-200/70 bg-gradient-to-b from-white/80 via-slate-50/85 to-slate-100/88 backdrop-blur-[2px]">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_60%_at_90%_15%,rgba(13,148,136,0.11),transparent_58%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_10%_80%,rgba(59,130,246,0.06),transparent_55%)]"
          aria-hidden
        />
        <div className={`${shell} relative py-6 md:py-8 xl:py-10 2xl:py-12`}>
          <div className="grid grid-cols-12 gap-x-4 gap-y-6 md:gap-x-6 md:gap-y-8 xl:gap-x-10 xl:gap-y-10 2xl:gap-x-12 items-start">
            <div className="col-span-12 lg:col-span-5 xl:col-span-5 flex flex-col justify-center">
              <p className="text-[11px] xl:text-xs 2xl:text-sm font-semibold uppercase tracking-[0.12em] text-brand-600 mb-2">
                Restaurant OS
              </p>
              <h1 className="font-sans text-[1.85rem] sm:text-[2.25rem] lg:text-[2.65rem] xl:text-[2.95rem] 2xl:text-[3.45rem] font-semibold tracking-[-0.035em] text-slate-950 leading-[1.08]">
                Ordering &amp; kitchen ops,
                <span className="text-brand-700"> one flow.</span>
              </h1>
              <p className="mt-3 md:mt-4 text-sm md:text-base xl:text-lg 2xl:text-xl text-slate-600 leading-snug max-w-xl xl:max-w-2xl 2xl:max-w-3xl">
                Digital menu, cart, checkout, and live order status — tuned for guests on mobile and owners on the
                dashboard.
              </p>
              <div className="mt-5 md:mt-6 flex flex-wrap items-center gap-3">
                <a
                  href="/menu"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-[12px] bg-slate-900 px-5 py-2.5 text-sm xl:text-base 2xl:text-lg font-semibold text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 2xl:px-6 2xl:py-3"
                >
                  View menu
                </a>
                {isAdmin ? (
                  <a
                    href="/admin/dashboard"
                    className="inline-flex min-h-[44px] items-center justify-center rounded-[12px] border border-slate-200 bg-white px-5 py-2.5 text-sm xl:text-base 2xl:text-lg font-semibold text-slate-800 shadow-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 2xl:px-6 2xl:py-3"
                  >
                    Dashboard
                  </a>
                ) : (
                  <a
                    href="/checkout"
                    className="inline-flex min-h-[44px] items-center justify-center rounded-[12px] border border-slate-200 bg-white px-5 py-2.5 text-sm xl:text-base 2xl:text-lg font-semibold text-slate-800 shadow-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 2xl:px-6 2xl:py-3"
                  >
                    Checkout
                  </a>
                )}
              </div>
              <dl className="mt-6 grid grid-cols-3 gap-4 md:gap-6 max-w-lg xl:max-w-2xl border-t border-slate-200/80 pt-5">
                <div>
                  <dt className="text-[10px] xl:text-[11px] 2xl:text-xs font-medium uppercase tracking-wide text-slate-400">Portions</dt>
                  <dd className="mt-0.5 text-sm xl:text-base 2xl:text-lg font-semibold text-slate-900">Half / full</dd>
                </div>
                <div>
                  <dt className="text-[10px] xl:text-[11px] 2xl:text-xs font-medium uppercase tracking-wide text-slate-400">Tracking</dt>
                  <dd className="mt-0.5 text-sm xl:text-base 2xl:text-lg font-semibold text-slate-900">Live status</dd>
                </div>
                <div>
                  <dt className="text-[10px] xl:text-[11px] 2xl:text-xs font-medium uppercase tracking-wide text-slate-400">Owners</dt>
                  <dd className="mt-0.5 text-sm xl:text-base 2xl:text-lg font-semibold text-slate-900">Real-time</dd>
                </div>
              </dl>
            </div>
            <div className="col-span-12 lg:col-span-7 xl:col-span-7 lg:pl-2 xl:pl-4">
              <DashboardPreview />
              <MenuPreviewMini />
              <p className="mt-2 text-[11px] text-slate-400 text-center lg:text-left">
                Product previews — dashboard &amp; menu
              </p>
            </div>
          </div>

          {/* Numbered value strip — bottom of hero (same max-width as grid above) */}
          <div className="mt-8 w-full border-t border-slate-200/70 pt-6 md:mt-10 md:pt-7">
            <div className="grid grid-cols-12 gap-3 md:gap-4 xl:gap-5 text-sm md:text-base xl:text-lg">
              <div className="col-span-12 sm:col-span-6 lg:col-span-3 flex gap-3 rounded-[8px] border border-slate-200/80 bg-white/70 px-3 py-2.5 shadow-sm backdrop-blur-sm">
                <span className="text-brand-600 font-semibold tabular-nums">01</span>
                <span className="text-slate-600 leading-snug">Mobile-first layout for ordering on the go.</span>
              </div>
              <div className="col-span-12 sm:col-span-6 lg:col-span-3 flex gap-3 rounded-[8px] border border-slate-200/80 bg-white/70 px-3 py-2.5 shadow-sm backdrop-blur-sm">
                <span className="text-brand-600 font-semibold tabular-nums">02</span>
                <span className="text-slate-600 leading-snug">Owner tools for menu and order control.</span>
              </div>
              <div className="col-span-12 sm:col-span-6 lg:col-span-3 flex gap-3 rounded-[8px] border border-slate-200/80 bg-white/70 px-3 py-2.5 shadow-sm backdrop-blur-sm">
                <span className="text-brand-600 font-semibold tabular-nums">03</span>
                <span className="text-slate-600 leading-snug">Transparent pricing — half &amp; full on every dish.</span>
              </div>
              <div className="col-span-12 sm:col-span-6 lg:col-span-3 flex gap-3 rounded-[8px] border border-slate-200/80 bg-white/70 px-3 py-2.5 shadow-sm backdrop-blur-sm">
                <span className="text-brand-600 font-semibold tabular-nums">04</span>
                <span className="text-slate-600 leading-snug">Status updates from kitchen to doorstep.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature cards — capped width so cards don’t stretch on ultra-wide */}
      <section className="relative border-b border-slate-200/80 bg-white/92 backdrop-blur-[1px]">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_35%_at_50%_0%,rgba(13,148,136,0.05),transparent_60%)]"
          aria-hidden
        />
        <div className={`${shell} relative py-6 xl:py-7 2xl:py-9`}>
          <div className="mb-4 max-w-3xl xl:max-w-4xl 2xl:max-w-5xl">
            <h2 className="font-sans text-lg md:text-xl xl:text-2xl 2xl:text-3xl font-semibold tracking-tight text-slate-950">
              Built for speed and clarity
            </h2>
            <p className="mt-1.5 text-sm md:text-base xl:text-lg 2xl:text-xl text-slate-600 leading-snug">
              Guest checkout, scannable menu, kitchen visibility — minimal chrome.
            </p>
          </div>
          <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
            <article className="group flex h-full flex-col rounded-[12px] border border-slate-200/90 bg-white p-5 shadow-card transition duration-200 hover:-translate-y-1 hover:border-brand-200/70 hover:shadow-[0_12px_40px_-16px_rgba(15,23,42,0.14)] xl:p-6 2xl:p-7">
              <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-brand-600 text-white shadow-sm xl:h-10 xl:w-10 2xl:h-11 2xl:w-11">
                <IconSteps className="h-4 w-4 xl:h-5 xl:w-5 2xl:h-6 2xl:w-6" />
              </div>
              <h3 className="mt-4 font-sans text-base xl:text-lg 2xl:text-xl font-semibold text-slate-900">Curated flow</h3>
              <p className="mt-2 flex-1 text-sm xl:text-base 2xl:text-lg text-slate-600 leading-snug">
                Steps and forms stay obvious — fewer drop-offs from cart to confirmation.
              </p>
            </article>
            <article className="group flex h-full flex-col rounded-[12px] border border-slate-200/90 bg-white p-5 shadow-card transition duration-200 hover:-translate-y-1 hover:border-amber-200/80 hover:shadow-[0_12px_40px_-16px_rgba(15,23,42,0.14)] xl:p-6 2xl:p-7">
              <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-amber-100 text-amber-900 shadow-sm xl:h-10 xl:w-10 2xl:h-11 2xl:w-11">
                <IconChef className="h-4 w-4 xl:h-5 xl:w-5 2xl:h-6 2xl:w-6" />
              </div>
              <h3 className="mt-4 font-sans text-base xl:text-lg 2xl:text-xl font-semibold text-slate-900">Menu structure</h3>
              <p className="mt-2 flex-1 text-sm xl:text-base 2xl:text-lg text-slate-600 leading-snug">
                Categories and pricing stay scannable; half/full portions on every line.
              </p>
            </article>
            <article className="group flex h-full flex-col rounded-[12px] border border-slate-200/90 bg-white p-5 shadow-card transition duration-200 hover:-translate-y-1 hover:border-emerald-200/80 hover:shadow-[0_12px_40px_-16px_rgba(15,23,42,0.14)] sm:col-span-2 lg:col-span-1 xl:p-6 2xl:p-7">
              <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-emerald-100 text-emerald-900 shadow-sm xl:h-10 xl:w-10 2xl:h-11 2xl:w-11">
                <IconPulse className="h-4 w-4 xl:h-5 xl:w-5 2xl:h-6 2xl:w-6" />
              </div>
              <h3 className="mt-4 font-sans text-base xl:text-lg 2xl:text-xl font-semibold text-slate-900">Live kitchen</h3>
              <p className="mt-2 flex-1 text-sm xl:text-base 2xl:text-lg text-slate-600 leading-snug">
                Guests track orders; owners see the queue update as tickets move.
              </p>
            </article>
          </div>
        </div>
      </section>
      </main>

      {/* Sticky to bottom of viewport when content is short (flex parent from App) */}
      <footer className="mt-auto w-full shrink-0 border-t border-slate-800 bg-gradient-to-b from-slate-950 to-slate-900 text-slate-100">
        <div className={`${shell} py-5 md:py-6 xl:py-7 2xl:py-8`}>
          <div className="grid grid-cols-12 gap-5 xl:gap-8 2xl:gap-10 items-center">
            <div className="col-span-12 lg:col-span-8">
              <p className="text-[11px] xl:text-xs 2xl:text-sm font-semibold uppercase tracking-[0.1em] text-slate-400">
                {isAdmin ? 'Owner' : 'Get started'}
              </p>
              <h2 className="mt-1 font-sans text-xl md:text-2xl xl:text-3xl 2xl:text-4xl font-semibold text-white tracking-tight">
                {isAdmin ? 'Manage menu & incoming orders' : 'Order your next meal in minutes'}
              </h2>
              <p className="mt-2 text-sm md:text-base xl:text-lg 2xl:text-xl text-slate-400 leading-snug max-w-xl xl:max-w-2xl 2xl:max-w-3xl">
                {isAdmin
                  ? 'Edit dishes on Manage menu; handle the live queue on Dashboard.'
                  : 'Browse the menu, build a cart, and track delivery — one account flow.'}
              </p>
            </div>
            <div className="col-span-12 lg:col-span-4 flex flex-wrap gap-2 lg:justify-end">
              <a
                href={isAdmin ? '/admin/menu' : '/menu'}
                className="inline-flex items-center justify-center rounded-[10px] bg-white px-4 py-2 text-sm xl:text-base 2xl:text-lg font-semibold text-slate-900 shadow-sm hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 2xl:px-5 2xl:py-2.5"
              >
                {isAdmin ? 'Manage menu' : 'Explore menu'}
              </a>
              {isAdmin ? (
                <a
                  href="/admin/dashboard"
                  className="inline-flex items-center justify-center rounded-[10px] border border-slate-600 bg-transparent px-4 py-2 text-sm xl:text-base 2xl:text-lg font-semibold text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 2xl:px-5 2xl:py-2.5"
                >
                  Dashboard
                </a>
              ) : (
                <Link
                  to="/admin/login"
                  className="inline-flex items-center justify-center rounded-[10px] border border-slate-600 bg-transparent px-4 py-2 text-sm xl:text-base 2xl:text-lg font-semibold text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 2xl:px-5 2xl:py-2.5"
                >
                  Owner login
                </Link>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
