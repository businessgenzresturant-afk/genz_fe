import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { getDeliveryCharge } from '../utils/deliveryCharge.js';

export default function Cart() {
  const { cart, dispatch } = useCart();
  const subtotal = cart.total;
  const tax = Math.round(subtotal * 0.05);
  const delivery = getDeliveryCharge('delivery', subtotal);
  const grandTotal = subtotal + tax + delivery;

  return (
    <div className="page-fill p-4 max-w-3xl mx-auto pb-16">
      <div className="panel p-6 md:p-8 mb-8 rounded-3xl border-slate-100">
        <h1 className="font-display text-3xl font-bold text-ink mb-1">Your cart</h1>
        <p className="text-sm text-ink-muted">Review items before you check out.</p>
      </div>

      <div className="space-y-4 mb-10">
        {cart.items.length === 0 && (
          <div className="panel p-12 text-center text-slate-600 rounded-2xl border-dashed border-2 border-slate-200">
            Your cart is empty.{' '}
            <Link to="/menu" className="text-delivery-600 font-bold underline decoration-delivery-300 underline-offset-2 hover:text-delivery-700">
              Browse the menu
            </Link>
          </div>
        )}
        {cart.items.map((line) => (
          <div
            key={`${line._id}-${line.size}`}
            className="panel p-4 flex items-center gap-4 border-slate-100"
          >
            <div className="w-16 h-16 shrink-0 rounded-2xl bg-gradient-to-br from-delivery-100 to-orange-50 border border-delivery-100/80" />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-ink">
                {line.name}{' '}
                <span className="text-ink-muted font-semibold">({line.size})</span>
              </h3>
              <div className="text-delivery-700 font-bold tabular-nums">
                ₹{(line.size === 'half' ? line.halfPrice : line.fullPrice) * line.quantity}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                className="w-9 h-9 rounded-xl border-2 border-slate-200 text-ink font-bold hover:bg-delivery-50 hover:border-delivery-200 focus-ring"
                aria-label="Decrease quantity"
                onClick={() => dispatch({
                  type: 'UPDATE_QUANTITY',
                  payload: { _id: line._id, size: line.size, quantity: line.quantity - 1 },
                })}
              >
                −
              </button>
              <span className="w-8 text-center font-semibold tabular-nums">{line.quantity}</span>
              <button
                type="button"
                className="w-9 h-9 rounded-xl border-2 border-slate-200 text-ink font-bold hover:bg-delivery-50 hover:border-delivery-200 focus-ring"
                aria-label="Increase quantity"
                onClick={() => dispatch({
                  type: 'UPDATE_QUANTITY',
                  payload: { _id: line._id, size: line.size, quantity: line.quantity + 1 },
                })}
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      {cart.items.length > 0 && (
        <>
          <div className="panel p-6 space-y-3 mb-8 text-slate-700">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Subtotal</span>
              <span className="tabular-nums font-medium">₹{subtotal}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">GST (5%)</span>
              <span className="tabular-nums font-medium">₹{tax}</span>
            </div>
            <div className="flex justify-between text-sm font-medium">
              <span className="text-slate-600">Delivery</span>
              <span className="tabular-nums">₹{delivery}</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-ink pt-4 border-t border-slate-200">
              <span>Grand total</span>
              <span className="tabular-nums text-delivery-700">₹{grandTotal}</span>
            </div>
          </div>
          <Link
            to="/checkout"
            className="block w-full btn-primary py-4 text-lg text-center rounded-2xl"
          >
            Proceed to checkout
          </Link>
        </>
      )}
    </div>
  );
}
