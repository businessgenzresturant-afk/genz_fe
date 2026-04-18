import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import { useAuth } from '../../context/AuthContext.jsx';
import NotificationPrompt from '../../components/NotificationPrompt.jsx';
import { showNotification } from '../../utils/browserNotifications.js';
import fallbackOrders from '../../assets/fallbackOrders.json';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://127.0.0.1:5000';

const PIPELINE = ['Confirmed', 'Cooking', 'Out for Delivery', 'Delivered'];

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'Confirmed', label: 'New' },
  { key: 'Cooking', label: 'Cooking' },
  { key: 'Out for Delivery', label: 'Out for delivery' },
  { key: 'Delivered', label: 'Delivered' },
  { key: 'Rejected', label: 'Rejected' },
];

export default function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [orderIdSearch, setOrderIdSearch] = useState('');
  const [busyId, setBusyId] = useState(null);
  const socketRef = useRef();
  const ordersRef = useRef([]);
  const navigate = useNavigate();
  const { token, refreshAuth } = useAuth();

  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  const mergeOrder = useCallback((updated) => {
    if (!updated || updated._id == null) return;
    const id = String(updated._id);

    setOrders((prev) => {
      const i = prev.findIndex((o) => String(o._id) === id);
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], ...updated };
        return next;
      }
      return [updated, ...prev];
    });
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  useEffect(() => {
    if (!token) {
      navigate('/admin/login', { replace: true });
      return;
    }

    fetch('/api/orders', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (res.status === 401 || res.status === 403) {
          return [];
        }
        const data = await res.json().catch(() => []);
        if (!res.ok || !Array.isArray(data)) {
          return fallbackOrders;
        }
        if (data.length === 0) {
          return fallbackOrders;
        }
        return data;
      })
      .then((data) => setOrders(Array.isArray(data) ? data : fallbackOrders))
      .catch(() => setOrders(fallbackOrders));

    socketRef.current = io(SOCKET_URL);
    socketRef.current.emit('join-dashboard');

    socketRef.current.on('new-order', (order) => {
      setOrders((prev) => {
        const withoutDemo = prev.filter((o) => !o.readOnly);
        return [order, ...withoutDemo];
      });
      if (order) {
        const label = order.orderNo ? `#${order.orderNo}` : 'New order';
        const total = order.total != null ? `₹${order.total}` : '';
        showNotification('New order', {
          body: [label, total].filter(Boolean).join(' · '),
          tag: `genz-new-${order._id}`,
        });
      }
    });

    socketRef.current.on('order-updated', (order) => {
      if (!order?._id) {
        mergeOrder(order);
        return;
      }
      const id = String(order._id);
      const prevStatus = ordersRef.current.find((o) => String(o._id) === id)?.status;
      const newStatus = order.status || 'Confirmed';
      mergeOrder(order);
      if (prevStatus !== undefined && prevStatus !== newStatus) {
        showNotification(`Order ${order.orderNo || id}`, {
          body: `Status: ${newStatus}`,
          tag: `genz-upd-${id}-${newStatus}`,
        });
      }
    });

    return () => socketRef.current?.disconnect();
  }, [token, mergeOrder, navigate]);

  const patchStatus = async (orderId, status) => {
    setBusyId(String(orderId));

    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();
      if (res.ok) mergeOrder(data);
    } catch (e) {
      console.error(e);
    } finally {
      setBusyId(null);
    }
  };

  const activeOrders = orders.filter(
    (o) => o.status !== 'Delivered' && o.status !== 'Rejected'
  ).length;

  const todaySales = orders.reduce(
    (sum, o) => sum + (Number(o.total) || 0),
    0
  );

  const showingOrderFallback =
    orders.length > 0 && orders.every((o) => o.readOnly === true);

  const filteredOrders = useMemo(() => {
    let list = orders;
    if (statusFilter !== 'all') {
      list = list.filter((o) => (o.status || 'Confirmed') === statusFilter);
    }
    const q = orderIdSearch.trim().toLowerCase().replace(/^#/, '');
    if (q) {
      list = list.filter((o) =>
        String(o.orderNo ?? '')
          .toLowerCase()
          .includes(q)
      );
    }
    return list;
  }, [orders, statusFilter, orderIdSearch]);

  if (!token) return null;

  return (
    <div className="page-fill min-h-screen w-full px-4 py-6 sm:px-6 md:px-8 lg:px-10">
      <div className="mx-auto w-full max-w-[min(1680px,94vw)] space-y-6">

        {/* HEADER */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Operations
            </p>
            <h1 className="text-3xl font-semibold text-slate-900">
              Live Orders
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-full bg-emerald-600 text-white text-sm font-semibold shadow">
              {activeOrders} active
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></span>
              Live
            </div>
          </div>
        </div>

        <NotificationPrompt description="Get desktop alerts when new orders arrive and when any order status changes." />

        {showingOrderFallback && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            Showing demo orders from bundled data — the API returned no orders or could not be
            reached. Status actions are disabled until live orders load.
          </div>
        )}

        {/* STATS */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Stat title="Active" value={activeOrders} sub="In progress" />
          <Stat title="Sales" value={`₹${todaySales}`} sub={`${orders.length} orders`} />
          <Stat title="Kitchen" value="Operational" sub="All stations" />
        </div>

        {/* Filters + search */}
        <div className="rounded-xl border border-slate-200/90 bg-white/90 p-4 shadow-sm backdrop-blur-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 flex-1">
              <label htmlFor="order-search" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Search by order ID
              </label>
              <div className="relative max-w-xl">
                <input
                  id="order-search"
                  type="search"
                  value={orderIdSearch}
                  onChange={(e) => setOrderIdSearch(e.target.value)}
                  placeholder="e.g. GENZ#443823 or partial match"
                  className="input-field min-h-[44px] w-full pr-10"
                  autoComplete="off"
                />
                {orderIdSearch && (
                  <button
                    type="button"
                    onClick={() => setOrderIdSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            <p className="text-xs text-slate-500 lg:shrink-0 lg:pb-2">
              Showing{' '}
              <span className="font-semibold text-slate-700">{filteredOrders.length}</span>
              {orders.length !== filteredOrders.length && (
                <span className="text-slate-400"> of {orders.length}</span>
              )}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {STATUS_FILTERS.map(({ key, label }) => {
              const active = statusFilter === key;
              const count =
                key === 'all'
                  ? orders.length
                  : orders.filter((o) => (o.status || 'Confirmed') === key).length;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatusFilter(key)}
                  className={`inline-flex min-h-[36px] items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                    active
                      ? 'border-brand-600 bg-brand-50 text-brand-900 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {label}
                  <span
                    className={`tabular-nums rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                      active ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ORDERS */}
        <div className="space-y-4">
          {orders.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white/60 py-16 text-center text-slate-500">
              No orders yet
            </div>
          )}

          {orders.length > 0 && filteredOrders.length === 0 && (
            <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/50 py-12 text-center text-amber-900/90">
              <p className="font-medium">No orders match your filters or search.</p>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('all');
                  setOrderIdSearch('');
                }}
                className="mt-3 text-sm font-semibold text-brand-700 underline decoration-brand-400 underline-offset-2 hover:text-brand-800"
              >
                Clear filters
              </button>
            </div>
          )}

          {filteredOrders.map((order) => {
            const id = order._id;
            const status = order.status || 'Confirmed';
            const isBusy = busyId === String(id);
            const readOnly = order.readOnly === true;

            return (
              <div
                key={id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition"
              >
                {/* TOP */}
                <div className="flex justify-between items-center mb-3">
                  <span className="font-semibold text-brand-700">
                    #{order.orderNo}
                  </span>

                  <StatusBadge status={status} />
                </div>

                {/* INFO */}
                <div className="text-sm text-slate-600 mb-2">
                  {order.customer?.name || 'Guest'} · {order.items?.length || 0} items
                </div>

                <div className="flex justify-between text-sm mb-4">
                  <span className="font-semibold text-slate-900">
                    ₹{order.total}
                  </span>
                  <span className="text-brand-600">
                    {order.paymentMethod}
                  </span>
                </div>

                {/* ACTIONS */}
                {readOnly ? (
                  <p className="text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                    Preview only — not a live order
                  </p>
                ) : status === 'Confirmed' ? (
                  <div className="flex gap-2">
                    <button
                      disabled={isBusy}
                      onClick={() => patchStatus(id, 'Cooking')}
                      className="flex-1 rounded-lg bg-emerald-600 text-white py-2 text-sm font-semibold hover:bg-emerald-500"
                    >
                      Accept
                    </button>

                    <button
                      disabled={isBusy}
                      onClick={() => patchStatus(id, 'Rejected')}
                      className="flex-1 rounded-lg bg-rose-600 text-white py-2 text-sm font-semibold hover:bg-rose-500"
                    >
                      Reject
                    </button>
                  </div>
                ) : status !== 'Delivered' && status !== 'Rejected' ? (
                  <select
                    value={status}
                    disabled={isBusy}
                    onChange={(e) => patchStatus(id, e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  >
                    {PIPELINE.filter((s) => s !== 'Confirmed').map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-slate-500">
                    {status === 'Delivered'
                      ? 'Order completed'
                      : 'Order rejected'}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------- COMPONENTS ---------- */

function Stat({ title, value, sub }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs text-slate-500 uppercase">{title}</p>
      <p className="text-2xl font-semibold text-slate-900 mt-1">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{sub}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    Confirmed: 'bg-slate-100 text-slate-700',
    Cooking: 'bg-amber-100 text-amber-800',
    'Out for Delivery': 'bg-blue-100 text-blue-700',
    Delivered: 'bg-emerald-100 text-emerald-700',
    Rejected: 'bg-rose-100 text-rose-700',
  };

  return (
    <span className={`px-3 py-1 text-xs rounded-full font-semibold ${map[status]}`}>
      {status}
    </span>
  );
}