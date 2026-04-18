import { useEffect, useState, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import NotificationPrompt from '../components/NotificationPrompt.jsx';
import { showNotification } from '../utils/browserNotifications.js';
import {
  addTrackOrderToHistory,
  listTrackOrderHistory,
  removeTrackOrderFromHistory,
  clearTrackOrderHistory,
} from '../utils/trackOrderStorage.js';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://127.0.0.1:5000';

/** 24-char hex MongoDB ObjectId */
function isMongoId(s) {
  return typeof s === 'string' && /^[a-fA-F0-9]{24}$/.test(s);
}

const STEPS = [
  { key: 'Confirmed', title: 'Order confirmed', description: 'We received your order' },
  { key: 'Cooking', title: 'Cooking', description: 'Kitchen is preparing your food' },
  { key: 'Out for Delivery', title: 'Out for delivery', description: 'On the way to you' },
  { key: 'Delivered', title: 'Delivered', description: 'Enjoy your meal' },
];

function stepIndex(status) {
  if (status === 'Rejected') return -1;
  const i = STEPS.findIndex((s) => s.key === status);
  return i >= 0 ? i : 0;
}

export default function OrderTrack() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [manualLookup, setManualLookup] = useState('');
  const orderQ = (params.get('order') || '').trim();
  const idQ = (params.get('id') || '').trim();

  let urlOrderNo = '';
  let trackId = '';
  if (idQ && isMongoId(idQ)) {
    trackId = idQ;
  }
  if (orderQ) {
    if (isMongoId(orderQ)) {
      trackId = orderQ;
    } else {
      urlOrderNo = orderQ;
    }
  }

  const hasTrack = !!(trackId || urlOrderNo);
  const trackKey = `${trackId}|${urlOrderNo}`;

  const [historyTick, setHistoryTick] = useState(0);
  const savedOrders = useMemo(() => {
    if (hasTrack) return [];
    return listTrackOrderHistory();
  }, [hasTrack, historyTick]);

  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(hasTrack);
  const socketRef = useRef();
  const lastTrackStatusRef = useRef(null);
  const orderRef = useRef(null);

  useEffect(() => {
    orderRef.current = order;
  }, [order]);

  useEffect(() => {
    lastTrackStatusRef.current = null;
  }, [trackKey]);

  useEffect(() => {
    if (!order) return;
    const s = order.status || 'Confirmed';
    if (lastTrackStatusRef.current === null) {
      lastTrackStatusRef.current = s;
      return;
    }
    if (lastTrackStatusRef.current !== s) {
      const prev = lastTrackStatusRef.current;
      lastTrackStatusRef.current = s;
      let body = `Status: ${s}`;
      if (prev === 'Confirmed' && s === 'Cooking') {
        body = 'Restaurant accepted your order — now cooking.';
      } else if (s === 'Rejected') {
        body = 'The restaurant could not fulfil this order.';
      } else if (s === 'Delivered') {
        body = 'Delivered — enjoy your meal!';
      } else if (s === 'Out for Delivery') {
        body = 'On the way to you.';
      }
      const label = order.orderNo || urlOrderNo || trackId;
      const tagKey = order._id ? String(order._id) : `${trackId || urlOrderNo}`;
      showNotification(`Order #${label}`, {
        body,
        tag: `track-${tagKey}-${s}`,
      });
    }
  }, [order, trackId, urlOrderNo]);

  useEffect(() => {
    if (!hasTrack) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setOrder(null);
    setError('');

    const trackUrl = trackId
      ? `/api/orders/track?id=${encodeURIComponent(trackId)}`
      : `/api/orders/track?orderNo=${encodeURIComponent(urlOrderNo)}`;

    socketRef.current = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current.emit('join-order', {
      ...(trackId && { orderId: trackId }),
      ...(urlOrderNo && { orderNo: urlOrderNo }),
    });

    const matchesPayload = (payload) => {
      if (!payload) return false;
      const resolved = orderRef.current;
      if (resolved) {
        if (payload.orderNo && resolved.orderNo && payload.orderNo === resolved.orderNo) return true;
        if (payload._id && resolved._id && String(payload._id) === String(resolved._id)) return true;
      }
      if (urlOrderNo && payload.orderNo === urlOrderNo) return true;
      if (trackId && payload._id && String(payload._id) === trackId) return true;
      return false;
    };

    socketRef.current.on('order-status', (payload) => {
      if (!matchesPayload(payload)) return;
      setOrder((prev) => ({ ...prev, ...payload }));
    });

    fetch(trackUrl)
      .then((res) => {
        if (res.status === 404) {
          removeTrackOrderFromHistory({ id: trackId || undefined, orderNo: urlOrderNo || undefined });
          throw new Error('Order not found');
        }
        if (!res.ok) throw new Error('Order not found');
        return res.json();
      })
      .then((data) => {
        if (data.orderNo && data._id != null) {
          addTrackOrderToHistory({ orderNo: data.orderNo, id: String(data._id) });
        }
        setOrder(data);
        setError('');
        socketRef.current?.emit('join-order', {
          orderNo: data.orderNo,
          orderId: data._id != null ? String(data._id) : undefined,
        });
      })
      .catch(() => setError('We could not load this order. Check the link or try again later.'))
      .finally(() => setLoading(false));

    return () => {
      socketRef.current?.disconnect();
    };
  }, [hasTrack, trackKey, trackId, urlOrderNo]);

  if (!hasTrack) {
    return (
      <div className="page-fill p-4 max-w-3xl mx-auto pb-16 space-y-6">
        {savedOrders.length > 0 && (
          <div className="panel p-6 space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-lg font-semibold text-slate-900">Your orders</h2>
              <button
                type="button"
                className="text-xs font-semibold text-slate-500 hover:text-rose-700"
                onClick={() => {
                  clearTrackOrderHistory();
                  setHistoryTick((t) => t + 1);
                }}
              >
                Clear all
              </button>
            </div>
            <p className="text-sm text-slate-600">
              Orders you opened from checkout or search are saved in this browser. Tap one to see
              details again.
            </p>
            <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
              {savedOrders.map((entry, idx) => {
                const key = `${entry.id || ''}-${entry.orderNo || ''}-${entry.savedAt || idx}`;
                const sp = new URLSearchParams();
                if (entry.orderNo) sp.set('order', entry.orderNo);
                if (entry.id) sp.set('id', entry.id);
                const href = `/track?${sp.toString()}`;
                return (
                  <li key={key} className="flex flex-wrap items-center justify-between gap-2 px-3 py-3">
                    <button
                      type="button"
                      onClick={() => navigate(href)}
                      className="min-w-0 flex-1 text-left font-medium text-delivery-800 hover:text-delivery-900 hover:underline"
                    >
                      {entry.orderNo ? (
                        <span className="tabular-nums">#{entry.orderNo}</span>
                      ) : (
                        <span className="font-mono text-sm">Order id</span>
                      )}
                      {entry.id && (
                        <span className="ml-2 font-mono text-xs text-slate-500">
                          {entry.orderNo ? `· ${entry.id.slice(0, 8)}…` : entry.id}
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      className="shrink-0 text-xs font-semibold text-slate-500 hover:text-rose-700"
                      onClick={() => {
                        removeTrackOrderFromHistory({ id: entry.id, orderNo: entry.orderNo });
                        setHistoryTick((t) => t + 1);
                      }}
                    >
                      Remove
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="panel p-6 space-y-4">
          <div>
            <h1 className="font-display text-xl font-semibold text-slate-900">Track an order</h1>
            <p className="text-sm text-slate-600 mt-1">
              Enter your order number (for example GENZ#123456) or the order id from your receipt or
              confirmation. Successful lookups are kept in the list above on this device.
            </p>
          </div>
          <form
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              const v = manualLookup.trim();
              if (!v) return;
              if (isMongoId(v)) {
                navigate(`/track?id=${encodeURIComponent(v)}`);
              } else {
                navigate(`/track?order=${encodeURIComponent(v)}`);
              }
            }}
          >
            <label className="flex-1 block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Order number or id
              </span>
              <input
                type="text"
                value={manualLookup}
                onChange={(e) => setManualLookup(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                placeholder="GENZ#… or paste order id"
                autoComplete="off"
              />
            </label>
            <button
              type="submit"
              className="rounded-xl bg-gradient-to-r from-delivery-500 to-flame-500 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:brightness-105"
            >
              Track
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-fill p-4 max-w-3xl mx-auto pb-16">
        <div className="panel p-8" role="status" aria-live="polite">
          <p className="text-slate-600">Loading order…</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="page-fill p-4 max-w-3xl mx-auto pb-16">
        <div className="panel p-6 border-rose-200 bg-rose-50/50 space-y-4">
          <p className="text-rose-800 font-medium">{error || 'Unknown error'}</p>
          <button
            type="button"
            className="text-sm font-bold text-delivery-700 hover:text-delivery-900 underline-offset-2 hover:underline"
            onClick={() => {
              removeTrackOrderFromHistory({ id: trackId || undefined, orderNo: urlOrderNo || undefined });
              navigate('/track', { replace: true });
            }}
          >
            Remove from saved list and try another
          </button>
        </div>
      </div>
    );
  }

  const status = order.status || 'Confirmed';
  const rejected = status === 'Rejected';
  const currentIdx = stepIndex(status);
  const addr = order.customer?.address || '—';

  return (
    <div className="page-fill p-4 max-w-3xl mx-auto pb-16">
      <div className="panel p-6 md:p-8 mb-8 rounded-3xl bg-gradient-to-br from-delivery-50/80 via-white to-orange-50/40 border-delivery-100">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-ink mb-1">
          Order #{order.orderNo}
        </h1>
        <p className="text-sm text-ink-muted">
          {rejected ? 'This order was not accepted.' : 'Live updates from the restaurant'}
        </p>
      </div>

      <div className="mb-6">
        <NotificationPrompt description="Get notified when your order is accepted and when the status updates." />
      </div>

      {rejected ? (
        <div className="panel p-6 mb-8 border-2 border-rose-200 bg-rose-50/90">
          <p className="font-display font-semibold text-rose-900">Order rejected</p>
          <p className="text-sm text-slate-700 mt-2">
            The restaurant could not fulfil this order. Contact them if you need help.
          </p>
        </div>
      ) : (
        <div className="panel p-6 md:p-8 space-y-5 mb-8">
          {STEPS.map((step, idx) => {
            const done = status === 'Delivered' || currentIdx > idx;
            const current = status !== 'Delivered' && currentIdx === idx;
            return (
              <div key={step.key} className="flex items-center gap-4">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0 text-sm shadow-md ${
                    done ? 'bg-emerald-500' : current ? 'bg-gradient-to-br from-delivery-500 to-flame-500' : 'bg-slate-300'
                  }`}
                  aria-hidden="true"
                >
                  {idx + 1}
                </div>
                <div>
                  <div className={`font-semibold ${current ? 'text-delivery-800' : 'text-slate-800'}`}>
                    {step.title}
                    {current && <span className="sr-only"> (current step)</span>}
                  </div>
                  <div className="text-sm text-slate-600">{step.description}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="panel p-6 mb-6">
        <div className="text-sm font-semibold text-slate-800 mb-3">Delivery / pickup</div>
        <div className="text-slate-700 space-y-1">
          <div className="font-medium">{order.customer?.name || '—'}</div>
          <div className="text-sm text-slate-600">{order.customer?.phone || ''}</div>
          <div className="mt-2 text-slate-800">{addr}</div>
        </div>
      </div>

      <div className="panel p-6 text-sm space-y-2">
        <div className="font-semibold text-slate-900 mb-3">Items</div>
        {Array.isArray(order.items) && order.items.length > 0 ? (
          order.items.map((line, i) => {
            const name = line.item?.name || line.item || 'Item';
            const size = line.size || '';
            const qty = line.quantity ?? 1;
            return (
              <div key={i} className="text-slate-700">
                {name} ×{qty} <span className="text-slate-500">({size})</span>
              </div>
            );
          })
        ) : (
          <div className="text-slate-500">No line items</div>
        )}
        <div className="font-bold text-lg text-delivery-900 pt-3 mt-3 border-t border-slate-200 tabular-nums">
          Total ₹{order.total ?? '—'}
        </div>
      </div>

      <div className="text-center text-sm text-slate-500 space-y-2">
        <p>
          <button
            type="button"
            className="font-bold text-delivery-700 hover:text-delivery-900 underline-offset-2 hover:underline"
            onClick={() => navigate('/track', { replace: true })}
          >
            Track a different order
          </button>
        </p>
        <p>
          <button
            type="button"
            className="text-slate-500 hover:text-rose-700 underline-offset-2 hover:underline"
            onClick={() => {
              removeTrackOrderFromHistory({
                id: order._id != null ? String(order._id) : undefined,
                orderNo: order.orderNo || undefined,
              });
              navigate('/track', { replace: true });
            }}
          >
            Remove this order from saved list
          </button>
        </p>
      </div>
    </div>
  );
}
