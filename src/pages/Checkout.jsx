import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useSession } from '../context/SessionContext.jsx';

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, dispatch, storageReady } = useCart();
  const { sessionId } = useSession();

  const [orderType, setOrderType] = useState('delivery');
  const [payment, setPayment] = useState('COD');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [paySettings, setPaySettings] = useState({ upiId: '', qrUrl: null });

  useEffect(() => {
    if (!sessionId) return;
    fetch(`/api/sessions/${sessionId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.checkout) return;
        const c = data.checkout;
        if (c.name) setName(c.name);
        if (c.phone) setPhone(c.phone);
        if (c.address) setAddress(c.address);
        if (c.orderType === 'takeaway' || c.orderType === 'delivery') setOrderType(c.orderType);
        if (c.paymentMethod === 'UPI' || c.paymentMethod === 'COD') setPayment(c.paymentMethod);
        if (c.couponCode && typeof c.couponCode === 'string') setCouponInput(c.couponCode);
      })
      .catch(() => {});
  }, [sessionId]);

  useEffect(() => {
    fetch('/api/settings/checkout')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        setPaySettings({
          upiId: typeof data.upiId === 'string' ? data.upiId : '',
          qrUrl: data.qrUrl || null,
        });
      })
      .catch(() => {});
  }, []);

  const validateAndApplyCoupon = useCallback(
    async (code, subtotalAmount) => {
      const trimmed = String(code || '').trim();
      if (!trimmed) {
        setAppliedCoupon(null);
        setCouponError('');
        return;
      }
      setCouponBusy(true);
      setCouponError('');
      try {
        const res = await fetch('/api/offers/validate-coupon', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: trimmed, subtotal: subtotalAmount }),
        });
        const data = await res.json().catch(() => ({}));
        if (data.valid) {
          setAppliedCoupon({
            code: data.couponCode,
            discountAmount: data.discountAmount,
            title: data.title,
          });
          setCouponInput(data.couponCode);
        } else {
          setAppliedCoupon(null);
          setCouponError(data.message || 'Invalid code');
        }
      } catch {
        setAppliedCoupon(null);
        setCouponError('Could not validate coupon');
      } finally {
        setCouponBusy(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!sessionId || !storageReady) return undefined;
    const t = setTimeout(() => {
      fetch(`/api/sessions/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkout: {
            name,
            phone,
            address,
            orderType,
            paymentMethod: payment,
            couponCode: appliedCoupon?.code || couponInput || '',
          },
        }),
      }).catch(() => {});
    }, 650);
    return () => clearTimeout(t);
  }, [
    name,
    phone,
    address,
    orderType,
    payment,
    sessionId,
    storageReady,
    appliedCoupon?.code,
    couponInput,
  ]);

  const subtotal = cart.total;
  const discountAmount = appliedCoupon ? Math.min(appliedCoupon.discountAmount, subtotal) : 0;
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const tax = Math.round(afterDiscount * 0.05);
  const delivery = orderType === 'delivery' && subtotal > 0 ? 30 : 0;
  const grandTotal = afterDiscount + tax + delivery;

  const hasUpiDetails =
    !!(paySettings.qrUrl || (typeof paySettings.upiId === 'string' && paySettings.upiId.trim()));

  useEffect(() => {
    if (!appliedCoupon?.code) return undefined;
    if (cart.total <= 0) {
      setAppliedCoupon(null);
      return undefined;
    }
    const t = setTimeout(() => {
      validateAndApplyCoupon(appliedCoupon.code, cart.total);
    }, 450);
    return () => clearTimeout(t);
  }, [cart.total, appliedCoupon?.code, validateAndApplyCoupon]);

  const placeOrder = async () => {
    setError('');
    if (!name.trim() || !phone.trim()) {
      setError('Please enter your name and phone.');
      return;
    }
    if (orderType === 'delivery' && !address.trim()) {
      setError('Delivery address is required for delivery orders.');
      return;
    }
    if (!cart.items.length) {
      setError('Your cart is empty.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            name: name.trim(),
            phone: phone.trim(),
            address: address.trim(),
          },
          items: cart.items.map((line) => ({
            item: line._id,
            size: line.size,
            quantity: line.quantity,
          })),
          subtotal,
          tax,
          deliveryCharge: delivery,
          total: grandTotal,
          paymentMethod: payment,
          orderType,
          sessionId,
          zone: 'Zone 1 (0-3km)',
          couponCode: appliedCoupon?.code || '',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          data.error ||
            (data.serverTotal != null
              ? `Total mismatch — expected ₹${data.serverTotal}. Refresh and try again.`
              : 'Could not place order.'),
        );
        return;
      }
      if (data.success && data.orderNo) {
        dispatch({ type: 'CLEAR_CART' });
        if (sessionId) {
          await fetch(`/api/sessions/${sessionId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              cart: { items: [], total: 0 },
              checkout: { couponCode: '' },
            }),
          }).catch(() => {});
        }
        navigate(
          `/track?order=${encodeURIComponent(data.orderNo)}&id=${encodeURIComponent(data.orderId)}`,
        );
      } else {
        setError(data.error || 'Could not place order.');
      }
    } catch {
      setError('Network error. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-fill p-4 max-w-3xl mx-auto pb-16">
      <div className="panel p-6 md:p-8 mb-8 rounded-3xl">
        <h1 className="font-display text-3xl font-bold text-ink mb-1">Checkout</h1>
        <p className="text-sm text-ink-muted">Enter your details to place your order.</p>
      </div>

      {!cart.items.length && (
        <div className="panel p-6 mb-8 text-center text-slate-600 rounded-2xl">
          Your cart is empty.{' '}
          <Link to="/menu" className="text-delivery-600 font-bold underline underline-offset-2 hover:text-delivery-700">
            Browse the menu
          </Link>
        </div>
      )}

      <div className="panel p-6 md:p-8 space-y-5 mb-8">
        <div>
          <label className="block text-sm font-medium text-slate-800 mb-1.5">Full name *</label>
          <input
            className="input-field min-h-[44px]"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-800 mb-1.5">Phone *</label>
          <input
            className="input-field min-h-[44px]"
            placeholder="+91 XXXXX XXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-800 mb-1.5">
            Delivery address {orderType === 'delivery' ? '*' : '(optional for takeaway)'}
          </label>
          <textarea
            className="input-field min-h-[100px] resize-y"
            rows={3}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            autoComplete="street-address"
          />
        </div>
        <div className="flex gap-2 p-1.5 rounded-2xl bg-slate-100/90 border border-slate-200/80">
          <button
            type="button"
            className={`flex-1 min-h-[44px] rounded-xl py-2.5 text-sm font-bold transition-colors focus-ring ${
              orderType === 'delivery'
                ? 'bg-white text-ink shadow-md border border-delivery-200'
                : 'text-ink-muted hover:bg-white/70'
            }`}
            onClick={() => setOrderType('delivery')}
          >
            Delivery
          </button>
          <button
            type="button"
            className={`flex-1 min-h-[44px] rounded-xl py-2.5 text-sm font-bold transition-colors focus-ring ${
              orderType === 'takeaway'
                ? 'bg-white text-ink shadow-md border border-delivery-200'
                : 'text-ink-muted hover:bg-white/70'
            }`}
            onClick={() => setOrderType('takeaway')}
          >
            Takeaway
          </button>
        </div>
      </div>

      {cart.items.length > 0 && (
        <div className="panel p-6 md:p-8 mb-8 space-y-3">
          <h3 className="font-display font-semibold text-lg text-slate-900">Promo code</h3>
          <p className="text-sm text-slate-600">
            Enter a code from our menu offers. Discount applies to subtotal before tax.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              className="input-field min-h-[44px] flex-1 font-mono uppercase tracking-wide"
              placeholder="e.g. GZ25"
              value={couponInput}
              onChange={(e) => {
                setCouponInput(e.target.value);
                setCouponError('');
              }}
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="button"
              disabled={couponBusy || !couponInput.trim()}
              onClick={() => validateAndApplyCoupon(couponInput, subtotal)}
              className="btn-primary min-h-[44px] px-6 rounded-xl shrink-0 disabled:opacity-50"
            >
              {couponBusy ? 'Checking…' : 'Apply'}
            </button>
            {appliedCoupon && (
              <button
                type="button"
                className="btn-secondary min-h-[44px] px-4 rounded-xl shrink-0"
                onClick={() => {
                  setAppliedCoupon(null);
                  setCouponError('');
                }}
              >
                Remove
              </button>
            )}
          </div>
          {couponError && (
            <p className="text-sm text-rose-600" role="alert">
              {couponError}
            </p>
          )}
          {appliedCoupon && !couponError && (
            <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
              Applied <strong>{appliedCoupon.code}</strong>
              {appliedCoupon.title ? ` — ${appliedCoupon.title}` : ''}. You save{' '}
              <strong className="tabular-nums">₹{discountAmount}</strong> on this order.
            </p>
          )}
        </div>
      )}

      <div className="panel p-6 mb-8 space-y-2 text-slate-700">
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Subtotal</span>
          <span className="tabular-nums">₹{subtotal}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-sm text-emerald-800">
            <span>Promo discount</span>
            <span className="tabular-nums font-medium">−₹{discountAmount}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">GST (5%)</span>
          <span className="tabular-nums">₹{tax}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">{orderType === 'delivery' ? 'Delivery' : 'Pickup'}</span>
          <span className="tabular-nums">₹{delivery}</span>
        </div>
        <div className="flex justify-between font-bold text-lg text-delivery-800 pt-3 mt-2 border-t border-slate-200">
          <span>Total</span>
          <span className="tabular-nums">₹{grandTotal}</span>
        </div>
      </div>

      <div className="panel p-6 md:p-8 mb-8">
        <h3 className="font-display font-semibold text-lg text-slate-900 mb-4">Payment</h3>
        <div className="space-y-3 mb-5">
          <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
            <input
              type="radio"
              name="pay"
              className="w-4 h-4 text-delivery-600 border-slate-300 focus:ring-delivery-500"
              checked={payment === 'UPI'}
              onChange={() => setPayment('UPI')}
            />
            <span className="text-slate-800">
              {hasUpiDetails ? 'UPI (QR / ID below)' : 'UPI'}
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
            <input
              type="radio"
              name="pay"
              className="w-4 h-4 text-delivery-600 border-slate-300 focus:ring-delivery-500"
              checked={payment === 'COD'}
              onChange={() => setPayment('COD')}
            />
            <span className="text-slate-800">Cash on delivery / at counter</span>
          </label>
        </div>
        {hasUpiDetails && (
          <div className="rounded-xl border border-slate-200 bg-slate-50/90 p-4 space-y-4">
            {paySettings.qrUrl && (
              <div>
                <div className="text-sm font-medium text-slate-800 mb-2">UPI QR</div>
                <div className="rounded-lg border border-slate-200 bg-white overflow-hidden max-w-xs mx-auto sm:mx-0">
                  <img
                    src={paySettings.qrUrl}
                    alt="Scan to pay with UPI"
                    className="w-full h-auto object-contain"
                  />
                </div>
                <a
                  href={paySettings.qrUrl}
                  download
                  className="mt-3 inline-flex w-full sm:w-auto justify-center btn-secondary py-2.5 px-4 text-sm rounded-xl"
                >
                  Download QR
                </a>
              </div>
            )}
            {paySettings.upiId?.trim() && (
              <div>
                <div className="text-sm font-medium text-slate-800 mb-1">UPI ID</div>
                <p className="text-sm text-slate-900 font-mono break-all">{paySettings.upiId.trim()}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <button
        type="button"
        disabled={submitting || !cart.items.length}
        onClick={placeOrder}
        className="w-full btn-primary py-4 text-lg rounded-2xl disabled:opacity-45 disabled:pointer-events-none"
      >
        {submitting ? 'Placing order…' : 'Place order'}
      </button>
    </div>
  );
}
