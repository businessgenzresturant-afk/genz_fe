import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import DishNameBackdrop from '../components/DishNameBackdrop.jsx';
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
   🔥 NEW CARD DESIGN
=========================== */
function MenuDishCard({ item, dispatch, canOrder }) {
  return (
    <article className="group rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">

      {/* Top visual */}
      <div className="relative h-32 bg-gradient-to-br from-slate-100 to-slate-200">
        <DishNameBackdrop name={item.name} />

        <span
          className={`absolute top-2 right-2 h-3 w-3 rounded-full ${
            item.veg ? 'bg-emerald-500' : 'bg-rose-500'
          }`}
        />
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col">

        <h3 className="text-base font-semibold text-slate-900 truncate">
          {item.name}
        </h3>

        <p className="text-xs text-slate-400 mt-1">
          {item.category}
        </p>

        <div className="mt-3 flex justify-between text-sm font-medium text-slate-700">
          <span>
            ₹{item.halfPrice}{' '}
            <span className="text-xs text-slate-400">Half</span>
          </span>
          <span>
            ₹{item.fullPrice}{' '}
            <span className="text-xs text-slate-400">Full</span>
          </span>
        </div>

        {/* Buttons */}
        <div className="mt-4 flex gap-2">
          <button
            disabled={!canOrder}
            onClick={() =>
              dispatch({ type: 'ADD_ITEM', payload: { item, size: 'half' } })
            }
            className="flex-1 h-10 rounded-lg border border-slate-200 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-40"
          >
            Half
          </button>

          <button
            disabled={!canOrder}
            onClick={() =>
              dispatch({ type: 'ADD_ITEM', payload: { item, size: 'full' } })
            }
            className="flex-1 h-10 rounded-lg bg-gradient-to-r from-brand-600 to-emerald-600 text-white text-sm font-semibold hover:brightness-105 disabled:opacity-40"
          >
            Full
          </button>
        </div>
      </div>
    </article>
  );
}

/* ===========================
   🔥 MAIN PAGE
=========================== */
export default function Menu() {
  const [items, setItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
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
    if (!activeCategory) return items;
    return items.filter(
      (item) => (item.category?.trim() || 'Other') === activeCategory
    );
  }, [items, activeCategory]);

  const cartCount = cart.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <main className="page-fill pb-16">

      <div className={`${shell} pt-6`}>

        {usingFallbackMenu && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            Showing demo menu from the app (API returned no data or is unreachable). Ordering is
            disabled until the server is available.
          </div>
        )}

        {/* 🔥 HEADER */}
        <div className="mb-6 flex items-center justify-between rounded-2xl bg-white/70 backdrop-blur-md border border-slate-200 px-6 py-4 shadow-sm">
          <div>
            <p className="text-xs font-semibold text-brand-600 uppercase">
              Menu
            </p>
            <h1 className="text-2xl font-bold text-slate-900">
              Gen-Z Restaurant
            </h1>
          </div>

          {canOrder ? (
            <Link
              to="/cart"
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-white font-semibold shadow"
            >
              Cart
              <span className="bg-white text-black text-xs px-2 py-0.5 rounded-full">
                {cartCount}
              </span>
            </Link>
          ) : (
            <Link
              to="/admin/menu"
              className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-semibold"
            >
              Manage Menu
            </Link>
          )}
        </div>

        {/* 🔥 CATEGORY PILLS */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition ${
                activeCategory === cat
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 🔥 GRID */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">

          {filteredItems.map((item) => (
            <MenuDishCard
              key={item._id || item.name}
              item={item}
              dispatch={dispatch}
              canOrder={canOrder}
            />
          ))}
        </div>

        {items.length === 0 && (
          <p className="text-center mt-10 text-slate-500">
            No items available
          </p>
        )}
      </div>
    </main>
  );
}