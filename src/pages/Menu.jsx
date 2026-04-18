import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import fallbackMenu from '../assets/fallbackMenu.json';

const shell =
  'mx-auto w-full max-w-[min(1700px,95vw)] px-4 sm:px-6 md:px-8 xl:px-10 2xl:px-12';

function groupItemsByCategory(items) {
  const map = new Map();
  for (const item of items) {
    const cat = item.category?.trim() || 'Other';
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat).push(item);
  }
  return [...map.entries()];
}

/* ===========================
   🔥 MINIMALIST MENU LIST ITEM
=========================== */
function MenuListItem({ item, dispatch, canOrder }) {
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
          <div className="flex items-center justify-between sm:justify-start gap-3 sm:gap-2 w-full sm:w-auto">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Half</span>
            <span className="font-bold text-slate-700 text-base">₹{item.halfPrice}</span>
          </div>
          <div className="flex items-center justify-between sm:justify-start gap-3 sm:gap-2 w-full sm:w-auto">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Full</span>
            <span className="font-bold text-slate-900 text-base">₹{item.fullPrice}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            disabled={!canOrder}
            onClick={() => dispatch({ type: 'ADD_ITEM', payload: { item, size: 'half' } })}
            className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm disabled:opacity-40 transition-all focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            Add Half
          </button>
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
    <div className="min-w-[280px] w-[280px] snap-center group rounded-[20px] bg-white/70 backdrop-blur-md border border-white/20 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-3 hover:bg-white/80 flex flex-col justify-between overflow-hidden relative">
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
  const [usingFallbackMenu, setUsingFallbackMenu] = useState(false);

  const { cart, dispatch } = useCart();
  const { isAdmin } = useAuth();
  const canOrder = !isAdmin && !usingFallbackMenu;

  useEffect(() => {
    fetch('/api/menu')
      .then((res) => {
        if (!res.ok) throw new Error('Menu unavailable');
        return res.json();
      })
      .then((data) => {
        const valid = Array.isArray(data) ? data : [];
        if (valid.length === 0) {
          setItems(fallbackMenu);
          setUsingFallbackMenu(true);
          const firstCat = fallbackMenu[0]?.category || 'Other';
          setActiveCategory(firstCat);
          return;
        }
        setItems(valid);
        setUsingFallbackMenu(false);
        const firstCat = valid[0]?.category || 'Other';
        setActiveCategory(firstCat);
      })
      .catch(() => {
        setItems(fallbackMenu);
        setUsingFallbackMenu(true);
        const firstCat = fallbackMenu[0]?.category || 'Other';
        setActiveCategory(firstCat);
      });
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

  const specials = useMemo(() => {
    const specialItems = items.filter(item => item.isSpecial);
    if (specialItems.length > 0) return specialItems;
    
    // Hardcoded demo specials for UI presentation
    return [
      { _id: 'sp1', name: 'Truffle Fries', category: 'Sides', veg: true, halfPrice: 120, fullPrice: 200, isSpecial: true },
      { _id: 'sp2', name: 'Neon Nachos', category: 'Mexican', veg: true, halfPrice: 150, fullPrice: 280, isSpecial: true },
      { _id: 'sp3', name: 'Kimchi Bao', category: 'Asian', veg: false, halfPrice: 180, fullPrice: 320, isSpecial: true },
      { _id: 'sp4', name: 'Avo-Toast Art', category: 'Breakfast', veg: true, halfPrice: 160, fullPrice: 290, isSpecial: true },
      { _id: 'sp5', name: 'Galaxy Macarons', category: 'Dessert', veg: true, halfPrice: 200, fullPrice: 350, isSpecial: true },
    ];
  }, [items]);

  const cartCount = cart.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <main className="w-full overflow-x-hidden text-slate-800 bg-[#FDFDFD] relative min-h-screen pb-16 selection:bg-delivery-200 selection:text-delivery-900">
      {/* Background gradients for the Antigravity feel */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-delivery-100/40 blur-3xl opacity-60" />
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-flame-100/40 blur-3xl opacity-60" />
        <div className="absolute bottom-[0%] left-[20%] w-[30%] h-[30%] rounded-full bg-amber-100/40 blur-3xl opacity-60" />
      </div>

      <div className={`${shell} pt-6 relative z-10 space-y-8 md:space-y-12`}>
        {usingFallbackMenu && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/80 backdrop-blur-sm px-4 py-3 text-sm text-amber-950 shadow-[0_20px_50px_rgba(0,0,0,0.08)]">
            Showing demo menu from the app (API returned no data or is unreachable). Ordering is
            disabled until the server is available.
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
                className="group flex items-center gap-3 rounded-2xl bg-white/70 backdrop-blur-md border border-white/20 px-5 py-3 shadow-[0_20px_50px_rgba(0,0,0,0.08)] hover:bg-white transition-all"
              >
                <span className="font-semibold text-slate-900 text-sm">Cart</span>
                <span className="bg-gradient-to-r from-delivery-500 to-flame-500 text-white text-xs font-bold px-2.5 py-1 rounded-full group-hover:brightness-105 transition-all">
                  {cartCount}
                </span>
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

          {/* Floating Island Promotion */}
          <div className="relative overflow-hidden rounded-[32px] bg-charcoal-900 text-white shadow-[0_0_40px_rgba(252,128,25,0.2)] border border-white/10 transition-transform duration-500 hover:-translate-y-1">
            {/* Subtle glow effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
            <div className="absolute top-0 right-0 w-[80%] h-[80%] bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.05),transparent_50%)] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[60%] h-[60%] bg-[radial-gradient(ellipse_at_bottom_left,rgba(252,128,25,0.15),transparent_50%)] pointer-events-none" />
            
            <div className="relative p-8 md:p-12 lg:p-16 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="max-w-2xl">
                <p className="text-delivery-300 font-bold tracking-widest uppercase text-xs mb-3">Limited Time Offer</p>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] mb-4">
                  25% OFF ALL <br className="hidden md:block" />BURGERS THIS WEEK!
                </h2>
                <div className="flex items-center gap-3 mt-6">
                  <span className="text-slate-300 font-medium">Use Code:</span>
                  <span className="bg-delivery-500/20 border border-delivery-400/30 text-delivery-300 font-mono font-bold px-4 py-1.5 rounded-lg text-lg tracking-wider backdrop-blur-md">GZ25</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 🔥 SPECIALS SECTION */}
        {specials.length > 0 && (
          <section className="animate-float-up opacity-0 delay-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Specials</h3>
              <button className="text-sm font-semibold text-delivery-600 hover:text-delivery-700 transition-colors flex items-center gap-1">
                See All Specials
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </button>
            </div>
            {/* Horizontal Scroll Container */}
            <div className="flex overflow-x-auto gap-4 pb-6 pt-2 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h3 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Main Menu</h3>
            
            {/* Filter Controls Container */}
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-white/70 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.08)]">
              {/* Category Pills */}
              <div className="flex gap-1 overflow-x-auto w-full sm:w-auto scrollbar-hide">
                <button
                  onClick={() => setActiveCategory(null)}
                  className={`px-5 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                    !activeCategory
                      ? 'bg-charcoal-900 text-white shadow-md'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-5 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                      activeCategory === cat
                        ? 'bg-charcoal-900 text-white shadow-md'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="hidden sm:block w-px h-8 bg-slate-200/80 mx-2" />

              {/* Veg/Non-Veg Toggle */}
              <div className="relative flex p-1 bg-slate-100/80 rounded-xl w-full sm:w-auto">
                <div
                  className="absolute inset-y-1 left-1 bg-white rounded-lg shadow-sm transition-all duration-300 ease-out border border-slate-200/50"
                  style={{
                    width: 'calc(33.333% - 2px)',
                    transform: `translateX(${
                      dietFilter === 'All' ? '0%' : dietFilter === 'Veg' ? '100%' : '200%'
                    })`,
                  }}
                />
                <button
                  onClick={() => setDietFilter('All')}
                  className={`relative z-10 px-4 py-1.5 text-xs font-bold rounded-lg transition-colors flex-1 text-center ${
                    dietFilter === 'All' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setDietFilter('Veg')}
                  className={`relative z-10 px-4 py-1.5 text-xs font-bold rounded-lg transition-colors flex-1 flex items-center justify-center gap-1.5 ${
                    dietFilter === 'Veg' ? 'text-emerald-700' : 'text-slate-500 hover:text-emerald-600'
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${dietFilter === 'Veg' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  Veg
                </button>
                <button
                  onClick={() => setDietFilter('Non-Veg')}
                  className={`relative z-10 px-4 py-1.5 text-xs font-bold rounded-lg transition-colors flex-1 flex items-center justify-center gap-1.5 ${
                    dietFilter === 'Non-Veg' ? 'text-rose-700' : 'text-slate-500 hover:text-rose-600'
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${dietFilter === 'Non-Veg' ? 'bg-rose-500' : 'bg-slate-300'}`} />
                  Non
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