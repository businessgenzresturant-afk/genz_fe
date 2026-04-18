import { useState, useEffect, useCallback, useId, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

const inputClass = 'input-field min-h-[44px] text-base';

export default function AdminMenu() {
  const { token } = useAuth();
  const formIds = useId();
  const [items, setItems] = useState([]);
  const [calendarDay, setCalendarDay] = useState('');
  const [loading, setLoading] = useState(true);
  const [addForm, setAddForm] = useState({
    name: '',
    category: '',
    veg: true,
    halfPrice: '',
    fullPrice: '',
    isSpecial: false,
  });
  const [addStatus, setAddStatus] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [nameSearch, setNameSearch] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/menu/admin', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.items) {
        setItems(data.items);
        setCalendarDay(data.calendarDay || '');
      } else {
        setItems([]);
      }
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAddItem = async (e) => {
    e.preventDefault();
    setAddStatus('Saving…');
    try {
      const res = await fetch('/api/menu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: addForm.name.trim(),
          category: addForm.category.trim(),
          veg: addForm.veg,
          halfPrice: Number(addForm.halfPrice),
          fullPrice: Number(addForm.fullPrice),
          isSpecial: addForm.isSpecial,
          available: true,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAddStatus(data.error || 'Could not add item');
        return;
      }
      setAddStatus('Added.');
      setAddForm({
        name: '',
        category: '',
        veg: true,
        halfPrice: '',
        fullPrice: '',
        isSpecial: false,
      });
      load();
    } catch {
      setAddStatus('Network error');
    }
  };

  const setServingToday = async (id, availableToday) => {
    setBusyId(String(id));
    try {
      const res = await fetch(`/api/menu/${id}/serving-today`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ unavailableToday: !availableToday }),
      });
      if (res.ok) {
        await load();
      }
    } finally {
      setBusyId(null);
    }
  };

  const filteredItems = useMemo(() => {
    const q = nameSearch.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const name = (item.name || '').toLowerCase();
      const cat = (item.category || '').toLowerCase();
      return name.includes(q) || cat.includes(q);
    });
  }, [items, nameSearch]);

  const existingCategories = useMemo(() => {
    const seen = new Set();
    for (const item of items) {
      const c = (item.category || '').trim();
      if (c) seen.add(c);
    }
    return [...seen].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  }, [items]);

  const categoryListId = `${formIds}-category-datalist`;

  return (
    <div className="page-fill min-h-[calc(100vh-4rem)] w-full px-4 py-6 sm:px-6 md:px-8 lg:px-10 pb-16">
      <div className="mx-auto w-full max-w-[min(1680px,94vw)]">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-bold uppercase text-brand-700 tracking-wider">Owner</p>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-slate-900">Manage menu</h1>
          <p className="text-sm text-slate-600 mt-1 max-w-xl">
            Add dishes and control what is <strong>available today</strong>. Each new calendar day, items become
            available again unless you turn them off.
            {calendarDay && (
              <span className="block mt-1 text-xs text-slate-500">Server date: {calendarDay} (UTC)</span>
            )}
          </p>
        </div>
        <Link to="/menu" className="btn-secondary text-sm min-h-[44px] inline-flex items-center rounded-xl">
          View public menu
        </Link>
      </div>

      <section className="panel p-6 md:p-8 mb-10 border border-brand-200 bg-gradient-to-br from-brand-50/90 to-white">
        <h2 className="font-display text-lg font-bold text-slate-900 mb-4">Add menu item</h2>
        <form onSubmit={handleAddItem} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="contents">
            <div>
              <label htmlFor={`${formIds}-name`} className="block text-sm font-medium text-slate-800 mb-1.5">
                Name <span className="text-rose-600">*</span>
              </label>
              <input
                id={`${formIds}-name`}
                required
                className={inputClass}
                value={addForm.name}
                onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor={`${formIds}-cat`} className="block text-sm font-medium text-slate-800 mb-1.5">
                Category <span className="text-rose-600">*</span>
              </label>
              <input
                id={`${formIds}-cat`}
                list={categoryListId}
                required
                autoComplete="off"
                placeholder="Pick existing or type new"
                className={inputClass}
                value={addForm.category}
                onChange={(e) => setAddForm((f) => ({ ...f, category: e.target.value }))}
              />
              <datalist id={categoryListId}>
                {existingCategories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              <p className="mt-1.5 text-xs text-slate-500">
                Use the arrow to choose a category already on your menu, or type a new one.
              </p>
            </div>
            <div>
              <label htmlFor={`${formIds}-h`} className="block text-sm font-medium text-slate-800 mb-1.5">
                Half (₹) <span className="text-rose-600">*</span>
              </label>
              <input
                id={`${formIds}-h`}
                type="number"
                min="0"
                required
                className={inputClass}
                value={addForm.halfPrice}
                onChange={(e) => setAddForm((f) => ({ ...f, halfPrice: e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor={`${formIds}-f`} className="block text-sm font-medium text-slate-800 mb-1.5">
                Full (₹) <span className="text-rose-600">*</span>
              </label>
              <input
                id={`${formIds}-f`}
                type="number"
                min="0"
                required
                className={inputClass}
                value={addForm.fullPrice}
                onChange={(e) => setAddForm((f) => ({ ...f, fullPrice: e.target.value }))}
              />
            </div>
          </div>
          <div className="md:col-span-2 flex flex-wrap gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={addForm.veg}
                onChange={(e) => setAddForm((f) => ({ ...f, veg: e.target.checked }))}
                className="rounded border-slate-300 text-brand-600"
              />
              <span className="text-sm font-medium text-slate-800">Vegetarian</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={addForm.isSpecial}
                onChange={(e) => setAddForm((f) => ({ ...f, isSpecial: e.target.checked }))}
                className="rounded border-slate-300 text-brand-600"
              />
              <span className="text-sm font-medium text-slate-800">Chef&apos;s special</span>
            </label>
          </div>
          <div className="md:col-span-2 flex items-center gap-4">
            <button type="submit" className="btn-primary min-h-[44px] px-6 rounded-xl">
              Add to menu
            </button>
            {addStatus && <span className="text-sm text-slate-600">{addStatus}</span>}
          </div>
        </form>
      </section>

      <section className="panel overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50/80 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900">Dishes &amp; today&apos;s availability</h2>
              <p className="mt-1 text-sm text-slate-600">
                Uncheck &quot;Available today&quot; to hide a dish from the customer menu until tomorrow.
              </p>
            </div>
            <div className="w-full min-w-0 lg:max-w-md lg:shrink-0">
              <label htmlFor={`${formIds}-search`} className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Search by name
              </label>
              <div className="relative">
                <input
                  id={`${formIds}-search`}
                  type="search"
                  value={nameSearch}
                  onChange={(e) => setNameSearch(e.target.value)}
                  placeholder="Dish or category…"
                  className="input-field min-h-[44px] w-full pr-10"
                  autoComplete="off"
                />
                {nameSearch && (
                  <button
                    type="button"
                    onClick={() => setNameSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  >
                    Clear
                  </button>
                )}
              </div>
              {!loading && items.length > 0 && (
                <p className="mt-2 text-xs text-slate-500">
                  Showing{' '}
                  <span className="font-semibold text-slate-700">{filteredItems.length}</span>
                  {filteredItems.length !== items.length && (
                    <span className="text-slate-400"> of {items.length}</span>
                  )}
                </p>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-600">Loading…</div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-slate-500">No dishes yet. Add one above.</div>
        ) : filteredItems.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-medium text-amber-900/90">No dishes match your search.</p>
            <button
              type="button"
              onClick={() => setNameSearch('')}
              className="mt-2 text-sm font-semibold text-brand-700 underline decoration-brand-400 underline-offset-2 hover:text-brand-800"
            >
              Clear search
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filteredItems.map((item) => {
              const id = item._id;
              const availableToday = !item.offToday;
              const disabled = busyId === String(id);
              return (
                <li
                  key={String(id)}
                  className={`flex flex-col sm:flex-row sm:items-center gap-3 p-4 ${
                    !availableToday ? 'bg-amber-50/50' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`size-2 rounded-full shrink-0 ${item.veg ? 'bg-emerald-500' : 'bg-rose-500'}`}
                      />
                      <span className="font-semibold text-slate-900">{item.name}</span>
                      <span className="text-xs text-slate-500 uppercase tracking-wide">{item.category}</span>
                      {item.isSpecial && (
                        <span className="text-xs bg-brand-100 text-brand-800 px-2 py-0.5 rounded-full">Special</span>
                      )}
                    </div>
                    <div className="text-sm text-slate-600 mt-1 tabular-nums">
                      Half ₹{item.halfPrice} · Full ₹{item.fullPrice}
                    </div>
                  </div>
                  <label className="flex items-center gap-2 shrink-0 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 text-brand-600 size-5"
                      checked={availableToday}
                      disabled={disabled}
                      onChange={(e) => setServingToday(id, e.target.checked)}
                    />
                    <span className="text-sm font-medium text-slate-800 whitespace-nowrap">Available today</span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      </div>
    </div>
  );
}
