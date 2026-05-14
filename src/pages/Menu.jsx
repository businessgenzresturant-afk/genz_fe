import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { IconCartLine, IconCopy } from '../components/icons.jsx';
import { apiClient } from '../utils/api.js';

const shell =
  'mx-auto w-full max-w-[min(1700px,95vw)] px-4 sm:px-6 md:px-8 xl:px-10 2xl:px-12';

function extractPromoCode(text) {
  if (!text || typeof text !== 'string') return null;
  const explicit = text.match(/(?:code|CODE)\s*[#:]?\s*([A-Z0-9]{4,})\b/);
  if (explicit) return explicit[1];
  const loose = text.match(/\b([A-Z]{2,}\d{2,}|[A-Z0-9]{5,})\b/);
  return loose ? loose[1] : null;
}

/** API may return `{}` or blank rows — do not render the hero promo unless something real is shown */
function offerHasDisplayableContent(o) {
  if (!o || typeof o !== 'object') return false;
  return !!(
    String(o.title || '').trim() ||
    String(o.subtitle || '').trim() ||
    String(o.description || '').trim() ||
    String(o.couponCode || '').trim()
  );
}

function offerNotExpiredPublic(o) {
  if (!o?.expiresAt) return true;
  const t = new Date(o.expiresAt).getTime();
  if (Number.isNaN(t)) return true;
  return t > Date.now();
}

async function copyTextToClipboard(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* continue to fallback */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

function OfferDescriptionInfo({ description, idPrefix = 'offer' }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const panelRef = useRef(null);
  const text = typeof description === 'string' ? description.trim() : '';

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (rootRef.current?.contains(e.target)) return;
      if (panelRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!text) return null;

  const panelId = `${idPrefix}-offer-desc`;

  const modal =
    open &&
    createPortal(
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
        <button
          type="button"
          className="absolute inset-0 bg-charcoal-900/45 backdrop-blur-[2px]"
          aria-label="Close offer details"
          onClick={() => setOpen(false)}
        />
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-modal="true"
          className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-200/95 bg-white text-left shadow-2xl"
        >
          <div className="max-h-[min(70vh,26rem)] overflow-y-auto overscroll-y-contain px-5 py-4 text-sm leading-relaxed text-slate-700 [scrollbar-width:thin] [scrollbar-color:rgb(203_213_225)_transparent]">
            {text}
          </div>
        </div>
      </div>,
      document.body
    );

  return (
    <>
      <span ref={rootRef} className="inline-flex shrink-0 align-middle">
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/5 text-delivery-300 transition hover:bg-white/12 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-delivery-400/60"
          aria-expanded={open}
          aria-controls={panelId}
          aria-haspopup="dialog"
          aria-label="Offer details"
          onClick={() => setOpen((v) => !v)}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>
      </span>
      {modal}
    </>
  );
}

function groupItemsByCategory(items) {
  const map = new Map();
  for (const item of items) {
    const cat = item.category?.trim() || 'Other';
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat).push(item);
  }
  return [...map.entries()];
}

function itemHasHalfPortion(item) {
  const n = Number(item?.halfPrice);
  return Number.isFinite(n) && n > 0;
}

/* ===========================
   🔥 MINIMALIST MENU LIST ITEM
=========================== */
function MenuListItem({ item, dispatch, canOrder }) {
  const hasHalf = itemHasHalfPortion(item);
  return (
    <article className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-5 border-b border-slate-200/60 transition-colors hover:bg-slate-50/50 px-3 rounded-xl">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5">
          <span
            className={`h-2.5 w-2.5 shrink-0 rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)] ${
              item.veg ? 'bg-emerald-500' : 'bg-rose-500'
            }`}
          />
          <h3 className="text-lg sm:text-xl font-bold font-sans text-slate-900 truncate tracking-tight">
            {item.name}
          </h3>
        </div>
        <p className="text-[11px] sm:text-xs font-medium text-slate-400 mt-1 uppercase tracking-[0.08em] ml-5">
          {item.category}
        </p>
      </div>

      <div className="flex items-center gap-5 sm:gap-8 shrink-0 ml-5 sm:ml-0">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 text-sm">
          {hasHalf ? (
            <>
              <div className="flex items-center justify-between sm:justify-start gap-3 sm:gap-2 w-full sm:w-auto">
                <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Half</span>
                <span className="font-bold text-slate-700 text-base">₹{item.halfPrice}</span>
              </div>
              <div className="flex items-center justify-between sm:justify-start gap-3 sm:gap-2 w-full sm:w-auto">
                <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Full</span>
                <span className="font-bold text-slate-900 text-base">₹{item.fullPrice}</span>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between sm:justify-start gap-3 sm:gap-2 w-full sm:w-auto">
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Full</span>
              <span className="font-bold text-slate-900 text-base">₹{item.fullPrice}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {hasHalf ? (
            <button
              disabled={!canOrder}
              onClick={() => dispatch({ type: 'ADD_ITEM', payload: { item, size: 'half' } })}
              className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm disabled:opacity-40 transition-all focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              Add Half
            </button>
          ) : null}
          <button
            disabled={!canOrder}
            onClick={() => dispatch({ type: 'ADD_ITEM', payload: { item, size: 'full' } })}
            className="h-10 px-4 rounded-xl bg-gradient-to-r from-delivery-500 to-flame-500 text-white text-xs font-bold hover:brightness-105 hover:shadow-md disabled:opacity-40 transition-all focus:outline-none focus:ring-2 focus:ring-delivery-500"
          >
            Add Full
          </button>
        </div>
      </div>
    </article>
  );
}

/* ===========================
   🔥 FLOATING SPECIAL CARD
=========================== */
function SpecialCard({ item, dispatch, canOrder }) {
  return (
    <div className="min-w-[280px] w-[280px] shrink-0 snap-center group rounded-[20px] bg-white/70 backdrop-blur-md border border-white/20 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-3 hover:bg-white/80 flex flex-col justify-between overflow-hidden relative">
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br from-delivery-100/50 to-transparent rounded-full blur-2xl pointer-events-none" />
      <div>
        <div className="flex justify-between items-center mb-3">
          <span className="inline-flex items-center rounded-full bg-delivery-50 border border-delivery-100 px-2.5 py-1 text-[10px] font-bold text-delivery-700 uppercase tracking-wider shadow-sm">
            Chef's Special
          </span>
          <span className={`h-2.5 w-2.5 rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)] ${item.veg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
        </div>
        <h4 className="text-xl font-bold text-slate-900 leading-tight tracking-tight mt-2">{item.name}</h4>
        <p className="text-xs font-medium text-slate-500 mt-1.5 uppercase tracking-wide">{item.category}</p>
      </div>
      <div className="mt-6 flex items-center justify-between">
        <span className="font-bold text-lg text-slate-900">₹{item.fullPrice}</span>
        <button
            disabled={!canOrder}
            onClick={() => dispatch({ type: 'ADD_ITEM', payload: { item, size: 'full' } })}
            className="h-9 px-4 rounded-full bg-gradient-to-r from-delivery-500 to-flame-500 text-white text-xs font-bold hover:brightness-105 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-delivery-500 focus:ring-offset-2 focus:ring-offset-transparent"
          >
            Add Full
          </button>
      </div>
    </div>
  );
}

/* ===========================
   🔥 MAIN PAGE
=========================== */
export default function Menu() {
  const [items, setItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [dietFilter, setDietFilter] = useState('All'); // 'All', 'Veg', 'Non-Veg'
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);
  const [promoOffers, setPromoOffers] = useState([]);
  const [featuredCodeCopied, setFeaturedCodeCopied] = useState(false);
  const [menuLoaded, setMenuLoaded] = useState(false);

  const { cart, dispatch } = useCart();
  const { isAdmin } = useAuth();
  const canOrder = !isAdmin && items.length > 0;

  useEffect(() => {
    apiClient
      .get('/api/menu')
      .then(({ data }) => data)
      .then((data) => {
        const valid = Array.isArray(data) ? data : [];
        setItems(valid);
        const firstCat = valid[0]?.category?.trim() || null;
        setActiveCategory(firstCat);
      })
      .catch(() => {
        setItems([]);
        setActiveCategory(null);
      })
      .finally(() => setMenuLoaded(true));
  }, []);

  useEffect(() => {
    apiClient
      .get('/api/offers')
      .then(({ data }) => data)
      .then((data) => {
        const list = Array.isArray(data) ? data.filter((o) => o && o.active !== false) : [];
        setPromoOffers(list);
      })
      .catch(() => setPromoOffers([]));
  }, []);

  useEffect(() => {
    if (!featuredCodeCopied) return undefined;
    const t = window.setTimeout(() => setFeaturedCodeCopied(false), 2200);
    return () => window.clearTimeout(t);
  }, [featuredCodeCopied]);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const collapse = () => {
      if (mq.matches) setCategoriesExpanded(false);
    };
    collapse();
    mq.addEventListener('change', collapse);
    return () => mq.removeEventListener('change', collapse);
  }, []);

  const grouped = useMemo(() => groupItemsByCategory(items), [items]);
  const categories = grouped.map(([cat]) => cat);

  const filteredItems = useMemo(() => {
    let result = items;
    if (activeCategory) {
      result = result.filter(
        (item) => (item.category?.trim() || 'Other') === activeCategory
      );
    }
    if (dietFilter === 'Veg') {
      result = result.filter((item) => item.veg === true);
    } else if (dietFilter === 'Non-Veg') {
      result = result.filter((item) => item.veg === false);
    }
    return result;
  }, [items, activeCategory, dietFilter]);

  const specials = useMemo(() => items.filter((item) => item.isSpecial), [items]);

  const cartCount = cart.items.reduce((s, i) => s + i.quantity, 0);

  const displayPromos = useMemo(
    () => promoOffers.filter(offerHasDisplayableContent).filter(offerNotExpiredPublic),
    [promoOffers],
  );
  const featuredPromo = displayPromos[0];
  const morePromos = displayPromos.slice(1);
  const promoCode =
    featuredPromo &&
    (String(featuredPromo.couponCode || '').trim() ||
      extractPromoCode(featuredPromo.description) ||
      extractPromoCode(featuredPromo.subtitle));

  const copyFeaturedPromoCode = useCallback(async () => {
    if (!promoCode) return;
    const ok = await copyTextToClipboard(promoCode);
    if (ok) setFeaturedCodeCopied(true);
  }, [promoCode]);

  return (
    <main className="w-full overflow-x-hidden text-slate-800 relative min-h-screen pb-16 selection:bg-delivery-200 selection:text-delivery-900">
      {/* Visible Food Image Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1974&auto=format&fit=crop')] bg-cover bg-center opacity-80" />
        <div className="absolute inset-0 bg-[#FDFDFD]/60 backdrop-blur-[2px]" />
      </div>

      {/* Background gradients for the Antigravity feel */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-delivery-100/40 blur-3xl opacity-80" />
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-flame-100/40 blur-3xl opacity-80" />
        <div className="absolute bottom-[0%] left-[20%] w-[30%] h-[30%] rounded-full bg-amber-100/40 blur-3xl opacity-80" />
      </div>

      <div className={`${shell} pt-6 relative z-10 space-y-8 md:space-y-12`}>
        {menuLoaded && items.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-slate-50/90 backdrop-blur-sm px-4 py-3 text-sm text-slate-700 shadow-[0_20px_50px_rgba(0,0,0,0.06)]">
            No menu data available. Check that the API is running and the menu has been loaded in the database.
          </div>
        )}

        {/* 🔥 HEADER & PROMOTION SECTION (HERO) */}
        <section className="relative animate-float-up opacity-0 delay-100">
          {/* Header Bar */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold tracking-[0.15em] text-slate-500 uppercase">
                Menu
              </p>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mt-1">
                Gen-Z Restaurant
              </h1>
            </div>

            {canOrder ? (
              <Link
                to="/cart"
                className="group relative inline-flex min-h-[44px] items-center gap-2 rounded-2xl bg-white/70 backdrop-blur-md border border-white/20 px-4 py-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.08)] hover:bg-white transition-all text-electric-800"
                aria-label={`Cart${cartCount ? `, ${cartCount} items` : ''}`}
              >
                <IconCartLine className="h-7 w-7 shrink-0" />
                <span className="font-semibold text-slate-900 text-sm">Cart</span>
                {cartCount > 0 && (
                  <span className="bg-gradient-to-r from-delivery-500 to-flame-500 text-white text-xs font-bold min-w-[1.25rem] px-2 py-0.5 rounded-full text-center tabular-nums group-hover:brightness-105 transition-all">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>
            ) : (
              <Link
                to="/admin/menu"
                className="px-5 py-3 rounded-2xl border border-white/20 bg-white/70 backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.08)] text-sm font-semibold hover:bg-white transition-colors"
              >
                Manage Menu
              </Link>
            )}
          </div>

          {/* Floating Island Promotion — from /api/offers */}
          {featuredPromo && (
            <div className="relative overflow-hidden rounded-[32px] bg-charcoal-900 text-white shadow-[0_0_40px_rgba(252,128,25,0.2)] border border-white/10 transition-transform duration-500 hover:-translate-y-1">
              
              {/* Visible Hero Background Image */}
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=1981&auto=format&fit=crop')] bg-cover bg-right opacity-70" />
              <div className="absolute inset-0 bg-gradient-to-r from-charcoal-900 via-charcoal-900/90 to-charcoal-900/20 pointer-events-none" />

              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
              <div className="absolute top-0 right-0 w-[80%] h-[80%] bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.05),transparent_50%)] pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-[60%] h-[60%] bg-[radial-gradient(ellipse_at_bottom_left,rgba(252,128,25,0.15),transparent_50%)] pointer-events-none" />

              <div className="relative p-8 md:p-12 lg:p-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                <div className="max-w-2xl w-full min-w-0">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <p className="text-delivery-300 font-bold tracking-widest uppercase text-xs">
                      Promotional offer
                    </p>
                    <OfferDescriptionInfo
                      description={featuredPromo.description}
                      idPrefix="featured"
                    />
                  </div>
                  <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.12] text-balance break-words whitespace-pre-line">
                    {featuredPromo.title}
                  </h2>
                  {featuredPromo.subtitle ? (
                    <p className="mt-3 text-base sm:text-lg font-medium text-slate-300 leading-snug">
                      {featuredPromo.subtitle}
                    </p>
                  ) : null}
                  {featuredPromo.expiresAt &&
                  !Number.isNaN(new Date(featuredPromo.expiresAt).getTime()) ? (
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Valid through{' '}
                      {new Date(featuredPromo.expiresAt).toLocaleDateString(undefined, {
                        dateStyle: 'medium',
                      })}
                    </p>
                  ) : null}
                  {promoCode ? (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-6">
                      <span className="text-slate-300 font-medium">Use code</span>
                      <div className="inline-flex items-stretch rounded-lg overflow-hidden border border-delivery-400/30 bg-delivery-500/20 backdrop-blur-md shadow-sm">
                        <span className="font-mono font-bold px-4 py-2 sm:py-1.5 text-base sm:text-lg tracking-wider text-delivery-300 tabular-nums self-center">
                          {promoCode}
                        </span>
                        <button
                          type="button"
                          onClick={copyFeaturedPromoCode}
                          className="flex items-center justify-center px-3 min-h-[44px] sm:min-h-0 border-l border-delivery-400/30 text-delivery-200 hover:bg-delivery-500/35 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-delivery-400/70"
                          aria-label={`Copy coupon code ${promoCode}`}
                        >
                          <IconCopy className="h-5 w-5 shrink-0" />
                        </button>
                      </div>
                      {featuredCodeCopied ? (
                        <span className="text-sm font-semibold text-delivery-300" role="status">
                          Copied!
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                  {morePromos.length > 0 ? (
                    <div className="mt-8 pt-6 border-t border-white/10">
                      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-delivery-300/90 mb-3">
                        More offers
                      </p>
                      <ul className="space-y-2.5">
                        {morePromos.map((o, idx) => (
                          <li
                            key={o._id || o.title}
                            className="flex items-start gap-2 text-sm text-slate-300 leading-snug"
                          >
                            <span className="min-w-0 flex-1">
                              <span className="font-semibold text-white">{o.title}</span>
                              {o.subtitle ? (
                                <span className="text-slate-400"> — {o.subtitle}</span>
                              ) : null}
                            </span>
                            <OfferDescriptionInfo description={o.description} idPrefix={`more-${idx}`} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* 🔥 SPECIALS SECTION */}
        {specials.length > 0 && (
          <section className="animate-float-up opacity-0 delay-200" aria-labelledby="specials-heading">
            <div className="mb-3 flex flex-col gap-1 sm:mb-4 sm:flex-row sm:items-end sm:justify-between">
              <h3 id="specials-heading" className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                Specials
              </h3>
              {specials.length > 2 && (
                <p className="text-xs font-medium text-slate-500">Swipe or scroll sideways for more</p>
              )}
            </div>
            <div
              className="specials-strip snap-x snap-mandatory pb-4 pt-2 -mx-4 px-4 sm:mx-0 sm:px-0 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-delivery-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FDFDFD]"
              role="region"
              aria-label="Chef specials, scroll horizontally for more"
              tabIndex={0}
            >
              {specials.map((item) => (
                <SpecialCard
                  key={item._id || item.name}
                  item={item}
                  dispatch={dispatch}
                  canOrder={canOrder}
                />
              ))}
            </div>
          </section>
        )}

        {/* 🔥 MAIN MENU SECTION */}
        <section className="animate-float-up opacity-0 delay-300">
          <div className="mb-6 space-y-4">
            <h3 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Main Menu</h3>

            {/* Filter controls: mobile = one clipped row + Show more; md+ = wrapped chips */}
            <div className="flex w-full min-w-0 flex-col gap-3 rounded-2xl border border-white/20 bg-white/70 p-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.08)] backdrop-blur-md lg:flex-row lg:items-stretch lg:gap-4">
              <div className="min-w-0 flex-1 rounded-xl bg-slate-50/80 ring-1 ring-slate-200/60">
                <div
                  className={`flex gap-2 px-2 py-2.5 sm:px-3 sm:py-3 md:flex-wrap md:overflow-visible ${
                    categoriesExpanded
                      ? 'max-md:flex-wrap max-md:overflow-visible'
                      : 'max-md:flex-nowrap max-md:overflow-x-hidden'
                  }`}
                  role="tablist"
                  aria-label="Menu categories"
                >
                  <button
                    type="button"
                    onClick={() => setActiveCategory(null)}
                    className={`shrink-0 rounded-xl px-3.5 py-2 text-left text-sm font-semibold leading-snug transition-all sm:px-4 max-md:whitespace-nowrap ${
                      !activeCategory
                        ? 'bg-charcoal-900 text-white shadow-md ring-1 ring-charcoal-800/80'
                        : 'bg-white/80 text-slate-700 ring-1 ring-slate-200/80 hover:bg-white hover:text-slate-900'
                    }`}
                  >
                    All
                  </button>
                  {categories.map((cat) => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`shrink-0 rounded-xl px-3.5 py-2 text-left text-sm font-semibold leading-snug transition-all sm:px-4 max-md:whitespace-nowrap md:max-w-[min(100%,20rem)] ${
                        activeCategory === cat
                          ? 'bg-charcoal-900 text-white shadow-md ring-1 ring-charcoal-800/80'
                          : 'bg-white/80 text-slate-700 ring-1 ring-slate-200/80 hover:bg-white hover:text-slate-900'
                      } ${categoriesExpanded ? 'max-md:max-w-[min(100%,20rem)] max-md:whitespace-normal' : ''}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                {categories.length > 0 && (
                  <div className="border-t border-slate-200/70 md:hidden">
                    <button
                      type="button"
                      className="w-full py-2.5 text-center text-sm font-semibold text-delivery-800 hover:bg-white/60 active:bg-white/80 transition-colors rounded-b-[10px]"
                      aria-expanded={categoriesExpanded}
                      onClick={() => setCategoriesExpanded((v) => !v)}
                    >
                      {categoriesExpanded ? 'Show less' : 'Show more'}
                    </button>
                  </div>
                )}
              </div>

              <div
                className="hidden w-px shrink-0 self-stretch bg-slate-200/80 lg:block"
                aria-hidden
              />

              {/* Veg / Non-Veg */}
              <div
                className="grid w-full shrink-0 grid-cols-3 gap-1 rounded-xl border border-slate-200/70 bg-slate-100/90 p-1 lg:w-[min(100%,18rem)] lg:self-center"
                role="group"
                aria-label="Diet filter"
              >
                <button
                  type="button"
                  onClick={() => setDietFilter('All')}
                  className={`flex min-h-[40px] items-center justify-center rounded-lg px-2 text-xs font-bold transition-colors ${
                    dietFilter === 'All'
                      ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80'
                      : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-800'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setDietFilter('Veg')}
                  className={`flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-bold transition-colors ${
                    dietFilter === 'Veg'
                      ? 'bg-white text-emerald-700 shadow-sm ring-1 ring-slate-200/80'
                      : 'text-slate-600 hover:bg-slate-200/60 hover:text-emerald-700'
                  }`}
                >
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${dietFilter === 'Veg' ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    aria-hidden
                  />
                  Veg
                </button>
                <button
                  type="button"
                  onClick={() => setDietFilter('Non-Veg')}
                  className={`flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-bold transition-colors ${
                    dietFilter === 'Non-Veg'
                      ? 'bg-white text-rose-700 shadow-sm ring-1 ring-slate-200/80'
                      : 'text-slate-600 hover:bg-slate-200/60 hover:text-rose-700'
                  }`}
                >
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${dietFilter === 'Non-Veg' ? 'bg-rose-500' : 'bg-slate-300'}`}
                    aria-hidden
                  />
                  Non-Veg
                </button>
              </div>
            </div>
          </div>

          {/* MINIMALIST LIST */}
          <div className="bg-white/70 backdrop-blur-md rounded-3xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.08)] p-2 sm:p-4">
            {filteredItems.length > 0 ? (
              <div className="flex flex-col">
                {filteredItems.map((item) => (
                  <MenuListItem
                    key={item._id || item.name}
                    item={item}
                    dispatch={dispatch}
                    canOrder={canOrder}
                  />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center px-4">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl" aria-hidden>
                    🍽️
                  </span>
                </div>
                <h4 className="text-lg font-bold text-slate-900">No menu data</h4>
                <p className="text-slate-500 mt-1 max-w-md">
                  Nothing to display. Connect the backend and ensure the menu endpoint returns dishes.
                </p>
              </div>
            ) : (
              <div className="py-20 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">🍽️</span>
                </div>
                <h4 className="text-lg font-bold text-slate-900">No items found</h4>
                <p className="text-slate-500 mt-1">Try changing your category or dietary filters.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}