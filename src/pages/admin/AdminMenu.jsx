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
  const [offers, setOffers] = useState([]);
  const [offerForm, setOfferForm] = useState({
    title: '',
    subtitle: '',
    description: '',
    active: true,
    sortOrder: 0,
    couponCode: '',
    discountPercent: '',
    discountFlat: '',
  });
  const [offerStatus, setOfferStatus] = useState('');
  const [busyOfferId, setBusyOfferId] = useState(null);

  const loadOffers = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/offers/admin', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data.offers)) {
        setOffers(data.offers);
      } else {
        setOffers([]);
      }
    } catch {
      setOffers([]);
    }
  }, [token]);

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

  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

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

  const handleAddOffer = async (e) => {
    e.preventDefault();
    if (!offerForm.title.trim()) {
      setOfferStatus('Title is required');
      return;
    }
    setOfferStatus('Saving…');
    try {
      const res = await fetch('/api/offers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: offerForm.title.trim(),
          subtitle: offerForm.subtitle.trim(),
          description: offerForm.description.trim(),
          active: offerForm.active,
          sortOrder: Number(offerForm.sortOrder) || 0,
          couponCode: offerForm.couponCode.trim(),
          discountPercent: offerForm.discountPercent === '' ? 0 : Number(offerForm.discountPercent),
          discountFlat: offerForm.discountFlat === '' ? 0 : Number(offerForm.discountFlat),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setOfferStatus(data.error || 'Could not save offer');
        return;
      }
      setOfferStatus('Offer added.');
      setOfferForm({
        title: '',
        subtitle: '',
        description: '',
        active: true,
        sortOrder: 0,
        couponCode: '',
        discountPercent: '',
        discountFlat: '',
      });
      loadOffers();
    } catch {
      setOfferStatus('Network error');
    }
  };

  const toggleOfferActive = async (id, active) => {
    setBusyOfferId(String(id));
    try {
      const res = await fetch(`/api/offers/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ active: !active }),
      });
      if (res.ok) await loadOffers();
    } finally {
      setBusyOfferId(null);
    }
  };

  const deleteOffer = async (id) => {
    if (!window.confirm('Remove this offer from the public menu?')) return;
    setBusyOfferId(String(id));
    try {
      const res = await fetch(`/api/offers/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) await loadOffers();
    } finally {
      setBusyOfferId(null);
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
          <p className="text-xs font-bold uppercase text-delivery-700 tracking-wider">Owner</p>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-slate-900">Manage menu</h1>
          <p className="text-sm text-slate-600 mt-1 max-w-xl">
            Add dishes, <strong>chef&apos;s specials</strong>, and <strong>promotional offers</strong>. Control what is{' '}
            <strong>available today</strong> per dish. Each new calendar day, items become available again unless you
            turn them off.
            {calendarDay && (
              <span className="block mt-1 text-xs text-slate-500">Server date: {calendarDay} (UTC)</span>
            )}
          </p>
        </div>
        <Link to="/menu" className="btn-secondary text-sm min-h-[44px] inline-flex items-center rounded-xl">
          View public menu
        </Link>
      </div>

      <section className="panel p-6 md:p-8 mb-10 border border-delivery-200 bg-gradient-to-br from-delivery-50/90 to-white">
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
                className="rounded border-slate-300 text-delivery-600"
              />
              <span className="text-sm font-medium text-slate-800">Vegetarian</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={addForm.isSpecial}
                onChange={(e) => setAddForm((f) => ({ ...f, isSpecial: e.target.checked }))}
                className="rounded border-slate-300 text-delivery-600"
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

      <section className="panel p-6 md:p-8 mb-10 border border-amber-200/90 bg-gradient-to-br from-amber-50/50 to-white">
        <h2 className="font-display text-lg font-bold text-slate-900 mb-1">Promotional offers</h2>
        <p className="text-sm text-slate-600 mb-6 max-w-2xl">
          Short promos shown under <strong>Specials &amp; offers</strong> on the public menu. Toggle visibility without
          deleting.
        </p>
        <form onSubmit={handleAddOffer} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="md:col-span-2">
            <label htmlFor={`${formIds}-offer-title`} className="block text-sm font-medium text-slate-800 mb-1.5">
              Title <span className="text-rose-600">*</span>
            </label>
            <input
              id={`${formIds}-offer-title`}
              className={inputClass}
              value={offerForm.title}
              onChange={(e) => setOfferForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Weekend combo"
            />
          </div>
          <div>
            <label htmlFor={`${formIds}-offer-sub`} className="block text-sm font-medium text-slate-800 mb-1.5">
              Subtitle
            </label>
            <input
              id={`${formIds}-offer-sub`}
              className={inputClass}
              value={offerForm.subtitle}
              onChange={(e) => setOfferForm((f) => ({ ...f, subtitle: e.target.value }))}
              placeholder="One line highlight"
            />
          </div>
          <div>
            <label htmlFor={`${formIds}-offer-sort`} className="block text-sm font-medium text-slate-800 mb-1.5">
              Sort order
            </label>
            <input
              id={`${formIds}-offer-sort`}
              type="number"
              min="0"
              className={inputClass}
              value={offerForm.sortOrder}
              onChange={(e) => setOfferForm((f) => ({ ...f, sortOrder: e.target.value }))}
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor={`${formIds}-offer-desc`} className="block text-sm font-medium text-slate-800 mb-1.5">
              Description
            </label>
            <textarea
              id={`${formIds}-offer-desc`}
              rows={3}
              className="input-field min-h-[88px] resize-y text-base"
              value={offerForm.description}
              onChange={(e) => setOfferForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Terms, dates, or how the offer works"
            />
          </div>
          <div>
            <label htmlFor={`${formIds}-offer-coupon`} className="block text-sm font-medium text-slate-800 mb-1.5">
              Checkout coupon code
            </label>
            <input
              id={`${formIds}-offer-coupon`}
              className={inputClass}
              value={offerForm.couponCode}
              onChange={(e) => setOfferForm((f) => ({ ...f, couponCode: e.target.value }))}
              placeholder="e.g. GZ25 (optional)"
              autoComplete="off"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor={`${formIds}-offer-pct`} className="block text-sm font-medium text-slate-800 mb-1.5">
                Discount % (subtotal)
              </label>
              <input
                id={`${formIds}-offer-pct`}
                type="number"
                min="0"
                max="100"
                className={inputClass}
                value={offerForm.discountPercent}
                onChange={(e) => setOfferForm((f) => ({ ...f, discountPercent: e.target.value }))}
                placeholder="0"
              />
            </div>
            <div>
              <label htmlFor={`${formIds}-offer-flat`} className="block text-sm font-medium text-slate-800 mb-1.5">
                Or flat ₹ off
              </label>
              <input
                id={`${formIds}-offer-flat`}
                type="number"
                min="0"
                className={inputClass}
                value={offerForm.discountFlat}
                onChange={(e) => setOfferForm((f) => ({ ...f, discountFlat: e.target.value }))}
                placeholder="0"
              />
            </div>
          </div>
          <p className="md:col-span-2 text-xs text-slate-500">
            If both % and flat are set, <strong>percent</strong> is used. Codes are matched at checkout (case-insensitive).
          </p>
          <div className="md:col-span-2 flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-slate-300 text-delivery-600"
                checked={offerForm.active}
                onChange={(e) => setOfferForm((f) => ({ ...f, active: e.target.checked }))}
              />
              <span className="text-sm font-medium text-slate-800">Visible on menu when saved</span>
            </label>
            <button type="submit" className="btn-primary min-h-[44px] px-6 rounded-xl">
              Add offer
            </button>
            {offerStatus && <span className="text-sm text-slate-600">{offerStatus}</span>}
          </div>
        </form>

        {offers.length === 0 ? (
          <p className="text-sm text-slate-500 border-t border-amber-100 pt-4">No offers yet. Add one above.</p>
        ) : (
          <ul className="divide-y divide-amber-100 border border-amber-100 rounded-xl overflow-hidden bg-white/80">
            {offers.map((o) => {
              const id = o._id;
              const busy = busyOfferId === String(id);
              return (
                <li key={String(id)} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900">{o.title}</div>
                    {o.subtitle && <div className="text-sm text-delivery-800 mt-0.5">{o.subtitle}</div>}
                    {o.description && (
                      <p className="text-sm text-slate-600 mt-2 line-clamp-2">{o.description}</p>
                    )}
                    {(o.couponCode || o.discountPercent || o.discountFlat) && (
                      <p className="text-xs font-mono text-delivery-800 mt-2">
                        Coupon: {o.couponCode || '—'}
                        {Number(o.discountPercent) > 0 && ` · ${o.discountPercent}% off subtotal`}
                        {Number(o.discountPercent) <= 0 && Number(o.discountFlat) > 0 && ` · ₹${o.discountFlat} off`}
                      </p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">Order: {o.sortOrder ?? 0}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-delivery-600"
                        checked={!!o.active}
                        disabled={busy}
                        onChange={() => toggleOfferActive(id, o.active)}
                      />
                      <span className="text-sm font-medium text-slate-800">Active</span>
                    </label>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => deleteOffer(id)}
                      className="text-sm font-semibold text-rose-700 hover:text-rose-900 px-2 py-1 rounded-lg hover:bg-rose-50"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
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
              className="mt-2 text-sm font-semibold text-delivery-700 underline decoration-delivery-400 underline-offset-2 hover:text-delivery-800"
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
                        <span className="text-xs bg-delivery-100 text-delivery-800 px-2 py-0.5 rounded-full">Special</span>
                      )}
                    </div>
                    <div className="text-sm text-slate-600 mt-1 tabular-nums">
                      Half ₹{item.halfPrice} · Full ₹{item.fullPrice}
                    </div>
                  </div>
                  <label className="flex items-center gap-2 shrink-0 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 text-delivery-600 size-5"
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
