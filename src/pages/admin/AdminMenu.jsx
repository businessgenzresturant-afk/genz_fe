import { useState, useEffect, useCallback, useId, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { apiClient } from '../../utils/api.js';

const inputClass = 'input-field min-h-[44px] text-base';

function ymdFromDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function defaultOfferExpiryYmd() {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return ymdFromDate(d);
}

/** Last moment of the chosen calendar day in the browser's local timezone (ISO string for API). */
function endOfLocalDayIsoFromYmd(ymd) {
  const parts = String(ymd).split('-').map((x) => parseInt(x, 10));
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return null;
  const [y, m, d] = parts;
  return new Date(y, m - 1, d, 23, 59, 59, 999).toISOString();
}

function ymdFromIso(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return ymdFromDate(d);
}

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
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editStatus, setEditStatus] = useState('');
  const [nameSearch, setNameSearch] = useState('');
  const [offers, setOffers] = useState([]);
  const [offerForm, setOfferForm] = useState({
    title: '',
    subtitle: '',
    description: '',
    active: true,
    sortOrder: 0,
    couponCode: '',
    discountMode: 'percent',
    discountAmount: '',
    expiresDate: defaultOfferExpiryYmd(),
  });
  const [offerStatus, setOfferStatus] = useState('');
  const [busyOfferId, setBusyOfferId] = useState(null);
  const [offerExpiryDrafts, setOfferExpiryDrafts] = useState({});

  const loadOffers = useCallback(async () => {
    if (!token) return;
    try {
      const res = await apiClient.get('/api/offers/admin', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (Array.isArray(res.data?.offers)) {
        setOffers(res.data.offers);
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
      const res = await apiClient.get('/api/menu/admin', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data;
      if (data.items) {
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

  useEffect(() => {
    const next = {};
    for (const o of offers) {
      if (o._id != null) next[String(o._id)] = ymdFromIso(o.expiresAt);
    }
    setOfferExpiryDrafts(next);
  }, [offers]);

  const parseOptionalHalfPrice = (raw) => {
    const s = String(raw ?? '').trim();
    if (s === '') return null;
    const n = Number(s);
    if (!Number.isFinite(n) || n < 0) return NaN;
    return n;
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    const halfPrice = parseOptionalHalfPrice(addForm.halfPrice);
    if (Number.isNaN(halfPrice)) {
      setAddStatus('Half price must be empty or a valid non-negative number.');
      return;
    }
    const fullPrice = Number(addForm.fullPrice);
    if (!Number.isFinite(fullPrice) || fullPrice < 0) {
      setAddStatus('Enter a valid full (₹) price.');
      return;
    }
    setAddStatus('Saving…');
    try {
      await apiClient.post('/api/menu', {
        name: addForm.name.trim(),
        category: addForm.category.trim(),
        veg: addForm.veg,
        halfPrice: halfPrice ?? 0,
        fullPrice,
        isSpecial: addForm.isSpecial,
        available: true,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
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
    } catch (err) {
      setAddStatus(err?.response?.data?.error || 'Network error');
    }
  };

  const handleAddOffer = async (e) => {
    e.preventDefault();
    if (!offerForm.title.trim()) {
      setOfferStatus('Title is required');
      return;
    }
    if (!offerForm.couponCode.trim()) {
      setOfferStatus('Checkout coupon code is required');
      return;
    }
    const amt = Number(offerForm.discountAmount);
    if (!Number.isFinite(amt) || amt <= 0) {
      setOfferStatus('Enter a discount amount greater than 0');
      return;
    }
    if (offerForm.discountMode === 'percent' && amt > 100) {
      setOfferStatus('Percent discount cannot exceed 100');
      return;
    }
    if (!String(offerForm.expiresDate || '').trim()) {
      setOfferStatus('Expiry date is required');
      return;
    }
    const expiresIso = endOfLocalDayIsoFromYmd(offerForm.expiresDate);
    if (!expiresIso) {
      setOfferStatus('Invalid expiry date');
      return;
    }
    const discountPercent = offerForm.discountMode === 'percent' ? amt : 0;
    const discountFlat = offerForm.discountMode === 'flat' ? amt : 0;
    setOfferStatus('Saving…');
    try {
      await apiClient.post('/api/offers', {
        title: offerForm.title.trim(),
        subtitle: offerForm.subtitle.trim(),
        description: offerForm.description.trim(),
        active: offerForm.active,
        sortOrder: Number(offerForm.sortOrder) || 0,
        couponCode: offerForm.couponCode.trim(),
        discountPercent,
        discountFlat,
        expiresAt: expiresIso,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setOfferStatus('Offer added.');
      setOfferForm({
        title: '',
        subtitle: '',
        description: '',
        active: true,
        sortOrder: 0,
        couponCode: '',
        discountMode: 'percent',
        discountAmount: '',
        expiresDate: defaultOfferExpiryYmd(),
      });
      loadOffers();
    } catch (err) {
      setOfferStatus(err?.response?.data?.error || 'Network error');
    }
  };

  const toggleOfferActive = async (id, active) => {
    setBusyOfferId(String(id));
    try {
      await apiClient.patch(`/api/offers/${id}`, { active: !active }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      await loadOffers();
    } finally {
      setBusyOfferId(null);
    }
  };

  const deleteOffer = async (id) => {
    if (!window.confirm('Remove this offer from the public menu?')) return;
    setBusyOfferId(String(id));
    try {
      await apiClient.delete(`/api/offers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await loadOffers();
    } finally {
      setBusyOfferId(null);
    }
  };

  const saveOfferExpiry = async (id) => {
    const ymd = offerExpiryDrafts[String(id)] || '';
    if (!ymd.trim()) {
      setOfferStatus('Pick an expiry date');
      return;
    }
    const iso = endOfLocalDayIsoFromYmd(ymd);
    if (!iso) {
      setOfferStatus('Invalid expiry date');
      return;
    }
    setBusyOfferId(String(id));
    setOfferStatus('');
    try {
      await apiClient.patch(`/api/offers/${id}`, { expiresAt: iso }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setOfferStatus('Expiry updated.');
      await loadOffers();
    } catch (err) {
      setOfferStatus(err?.response?.data?.error || 'Network error');
    } finally {
      setBusyOfferId(null);
    }
  };

  const setServingToday = async (id, availableToday) => {
    setBusyId(String(id));
    try {
      await apiClient.patch(`/api/menu/${id}/serving-today`, { unavailableToday: !availableToday }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const startEdit = (item) => {
    setEditingId(String(item._id));
    setEditStatus('');
    setEditForm({
      name: item.name || '',
      category: item.category || '',
      halfPrice: String(item.halfPrice ?? ''),
      fullPrice: String(item.fullPrice ?? ''),
      veg: !!item.veg,
      isSpecial: !!item.isSpecial,
      available: item.available !== false,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
    setEditStatus('');
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!editingId || !editForm) return;
    const halfPrice = parseOptionalHalfPrice(editForm.halfPrice);
    if (Number.isNaN(halfPrice)) {
      setEditStatus('Half price must be empty or a valid non-negative number.');
      return;
    }
    const fullPrice = Number(editForm.fullPrice);
    if (!Number.isFinite(fullPrice) || fullPrice < 0) {
      setEditStatus('Enter a valid full (₹) price.');
      return;
    }
    setEditStatus('Saving…');
    try {
      await apiClient.patch(`/api/menu/${editingId}`, {
        name: editForm.name.trim(),
        category: editForm.category.trim(),
        halfPrice: halfPrice ?? 0,
        fullPrice,
        veg: editForm.veg,
        isSpecial: editForm.isSpecial,
        available: editForm.available,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      cancelEdit();
      await load();
    } catch (err) {
      setEditStatus(err?.response?.data?.error || 'Network error');
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
                Half (₹) <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                id={`${formIds}-h`}
                type="number"
                min="0"
                className={inputClass}
                value={addForm.halfPrice}
                onChange={(e) => setAddForm((f) => ({ ...f, halfPrice: e.target.value }))}
                placeholder="Leave blank for full portion only"
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
          Short promos shown under <strong>Specials &amp; offers</strong> on the public menu. Each offer needs an
          expiry; after that date it hides from the menu and the coupon stops working. Toggle visibility without
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
            <label htmlFor={`${formIds}-offer-expires`} className="block text-sm font-medium text-slate-800 mb-1.5">
              Expires on <span className="text-rose-600">*</span>
            </label>
            <input
              id={`${formIds}-offer-expires`}
              type="date"
              required
              min={ymdFromDate(new Date())}
              className={`${inputClass} max-w-xs`}
              value={offerForm.expiresDate}
              onChange={(e) => setOfferForm((f) => ({ ...f, expiresDate: e.target.value }))}
            />
            <p className="text-xs text-slate-500 mt-1.5 max-w-xl">
              Valid through the end of this calendar day in your browser&apos;s time zone. The public menu and checkout
              both respect this date.
            </p>
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
          <div className="md:col-span-2">
            <label htmlFor={`${formIds}-offer-coupon`} className="block text-sm font-medium text-slate-800 mb-1.5">
              Checkout coupon code <span className="text-rose-600">*</span>
            </label>
            <input
              id={`${formIds}-offer-coupon`}
              required
              className={inputClass}
              value={offerForm.couponCode}
              onChange={(e) => setOfferForm((f) => ({ ...f, couponCode: e.target.value }))}
              placeholder="e.g. GZ25"
              autoComplete="off"
            />
          </div>
          <div className="md:col-span-2 space-y-3">
            <p className="text-sm font-medium text-slate-800">
              Discount <span className="text-rose-600">*</span>{' '}
              <span className="font-normal text-slate-500">(choose one)</span>
            </p>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={`${formIds}-offer-discount-mode`}
                  className="text-delivery-600 border-slate-300"
                  checked={offerForm.discountMode === 'percent'}
                  onChange={() => setOfferForm((f) => ({ ...f, discountMode: 'percent' }))}
                />
                <span className="text-sm font-medium text-slate-800">Percent off subtotal</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={`${formIds}-offer-discount-mode`}
                  className="text-delivery-600 border-slate-300"
                  checked={offerForm.discountMode === 'flat'}
                  onChange={() => setOfferForm((f) => ({ ...f, discountMode: 'flat' }))}
                />
                <span className="text-sm font-medium text-slate-800">Flat ₹ off subtotal</span>
              </label>
            </div>
            <div>
              <label htmlFor={`${formIds}-offer-discount-amt`} className="block text-sm font-medium text-slate-800 mb-1.5">
                {offerForm.discountMode === 'percent' ? 'Percent (1–100)' : 'Amount (₹)'}
              </label>
              <input
                id={`${formIds}-offer-discount-amt`}
                type="number"
                min="0"
                max={offerForm.discountMode === 'percent' ? '100' : undefined}
                step={offerForm.discountMode === 'flat' ? '1' : '0.5'}
                required
                className={`${inputClass} max-w-xs`}
                value={offerForm.discountAmount}
                onChange={(e) => setOfferForm((f) => ({ ...f, discountAmount: e.target.value }))}
                placeholder={offerForm.discountMode === 'percent' ? 'e.g. 15' : 'e.g. 50'}
              />
            </div>
          </div>
          <p className="md:col-span-2 text-xs text-slate-500">
            Coupon codes are matched at checkout (case-insensitive). Each offer uses either a percent or a flat
            discount, not both.
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
                    {(() => {
                      const end = o.expiresAt ? new Date(o.expiresAt) : null;
                      const hasEnd = end && !Number.isNaN(end.getTime());
                      const expired = hasEnd && end.getTime() <= Date.now();
                      return (
                        <p className={`text-xs mt-1.5 ${expired ? 'text-rose-700 font-semibold' : 'text-slate-600'}`}>
                          {hasEnd
                            ? `Ends: ${end.toLocaleDateString(undefined, { dateStyle: 'medium' })}${
                                expired ? ' (expired — hidden from menu & checkout)' : ''
                              }`
                            : 'No expiry on file (legacy). Set a date below.'}
                        </p>
                      );
                    })()}
                    <p className="text-xs text-slate-400 mt-1">Order: {o.sortOrder ?? 0}</p>
                    <div className="mt-3 flex flex-wrap items-end gap-2">
                      <div>
                        <label
                          htmlFor={`${formIds}-exp-${id}`}
                          className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1"
                        >
                          Change expiry
                        </label>
                        <input
                          id={`${formIds}-exp-${id}`}
                          type="date"
                          className={`${inputClass} min-h-[40px] text-sm max-w-[11rem]`}
                          value={offerExpiryDrafts[String(id)] ?? ''}
                          onChange={(e) =>
                            setOfferExpiryDrafts((d) => ({ ...d, [String(id)]: e.target.value }))
                          }
                          disabled={busy}
                        />
                      </div>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => saveOfferExpiry(id)}
                        className="min-h-[40px] px-3 rounded-lg border border-amber-200 bg-white text-sm font-semibold text-delivery-900 hover:bg-amber-50/80 disabled:opacity-50"
                      >
                        Save expiry
                      </button>
                    </div>
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
              const isEditing = editingId === String(id);

              if (isEditing && editForm) {
                return (
                  <li key={String(id)} className="p-4 bg-slate-50/90 border-b border-slate-200">
                    <form onSubmit={saveEdit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Name</label>
                          <input
                            required
                            className={inputClass}
                            value={editForm.name}
                            onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Category</label>
                          <input
                            required
                            list={categoryListId}
                            className={inputClass}
                            value={editForm.category}
                            onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">
                            Half (₹) <span className="text-slate-400 font-normal">(optional)</span>
                          </label>
                          <input
                            type="number"
                            min="0"
                            className={inputClass}
                            value={editForm.halfPrice}
                            onChange={(e) => setEditForm((f) => ({ ...f, halfPrice: e.target.value }))}
                            placeholder="Blank = full only"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Full (₹)</label>
                          <input
                            required
                            type="number"
                            min="0"
                            className={inputClass}
                            value={editForm.fullPrice}
                            onChange={(e) => setEditForm((f) => ({ ...f, fullPrice: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4 items-center">
                        <label className="flex items-center gap-2 cursor-pointer text-sm">
                          <input
                            type="checkbox"
                            checked={editForm.veg}
                            onChange={(e) => setEditForm((f) => ({ ...f, veg: e.target.checked }))}
                            className="rounded border-slate-300 text-delivery-600"
                          />
                          Vegetarian
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-sm">
                          <input
                            type="checkbox"
                            checked={editForm.isSpecial}
                            onChange={(e) => setEditForm((f) => ({ ...f, isSpecial: e.target.checked }))}
                            className="rounded border-slate-300 text-delivery-600"
                          />
                          Chef&apos;s special
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-sm">
                          <input
                            type="checkbox"
                            checked={editForm.available}
                            onChange={(e) => setEditForm((f) => ({ ...f, available: e.target.checked }))}
                            className="rounded border-slate-300 text-delivery-600"
                          />
                          On public menu
                        </label>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <button type="submit" className="btn-primary min-h-[40px] px-5 rounded-xl text-sm">
                          Save changes
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="btn-secondary min-h-[40px] px-5 rounded-xl text-sm"
                        >
                          Cancel
                        </button>
                        {editStatus && <span className="text-sm text-slate-600">{editStatus}</span>}
                      </div>
                    </form>
                  </li>
                );
              }

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
                      {item.available === false && (
                        <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">Hidden</span>
                      )}
                    </div>
                    <div className="text-sm text-slate-600 mt-1 tabular-nums">
                      {Number.isFinite(Number(item.halfPrice)) && Number(item.halfPrice) > 0 ? (
                        <>Half ₹{item.halfPrice} · </>
                      ) : (
                        <span className="text-slate-500">Full portion only · </span>
                      )}
                      Full ₹{item.fullPrice}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => startEdit(item)}
                      className="text-sm font-semibold text-delivery-700 hover:text-delivery-900 px-3 py-2 rounded-lg hover:bg-delivery-50 min-h-[44px]"
                    >
                      Edit
                    </button>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-delivery-600 size-5"
                        checked={availableToday}
                        disabled={disabled}
                        onChange={(e) => setServingToday(id, e.target.checked)}
                      />
                      <span className="text-sm font-medium text-slate-800 whitespace-nowrap">Available today</span>
                    </label>
                  </div>
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
