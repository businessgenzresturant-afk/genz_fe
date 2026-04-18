import { useState, useEffect } from 'react';
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

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
      })
      .catch(() => {});
  }, [sessionId]);

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
          },
        }),
      }).catch(() => {});
    }, 650);
    return () => clearTimeout(t);
  }, [name, phone, address, orderType, payment, sessionId, storageReady]);

  const subtotal = cart.total;
  const tax = Math.round(subtotal * 0.05);
  const delivery = orderType === 'delivery' && subtotal > 0 ? 30 : 0;
  const grandTotal = subtotal + tax + delivery;

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
        }),
      });
      const data = await res.json();
      if (data.success && data.orderNo) {
        dispatch({ type: 'CLEAR_CART' });
        if (sessionId) {
          await fetch(`/api/sessions/${sessionId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cart: { items: [], total: 0 } }),
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

      <div className="panel p-6 mb-8 space-y-2 text-slate-700">
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Subtotal</span>
          <span className="tabular-nums">₹{subtotal}</span>
        </div>
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
        <div className="bg-slate-50 rounded-xl p-4 mb-5 border border-slate-200">
          <div className="text-sm font-medium text-slate-800 mb-2">UPI QR</div>
          <div className="w-full h-32 bg-slate-200/80 rounded-lg flex items-center justify-center text-slate-500 text-sm mb-2">
            QR preview
          </div>
          <div className="text-sm text-slate-700 mb-3 font-mono">restaurant@upi</div>
          <button type="button" className="w-full btn-secondary py-2 text-sm">
            Download QR
          </button>
        </div>
        <label className="flex items-center gap-2 mb-3 cursor-pointer">
          <input
            type="radio"
            name="pay"
            className="w-4 h-4 text-delivery-600 border-slate-300 focus:ring-delivery-500"
            checked={payment === 'UPI'}
            onChange={() => setPayment('UPI')}
          />
          <span className="text-slate-800">UPI (scan above)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
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
