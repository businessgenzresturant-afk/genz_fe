import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar.jsx';
import AdminOnly from './components/AdminOnly.jsx';
import CustomerOnly from './components/CustomerOnly.jsx';
import Landing from './pages/Landing.jsx';
import Menu from './pages/Menu.jsx';
import Cart from './pages/Cart.jsx';
import Checkout from './pages/Checkout.jsx';
import OrderTrack from './pages/OrderTrack.jsx';
import Login from './pages/admin/Login.jsx';
import Dashboard from './pages/admin/Dashboard.jsx';
import AdminMenu from './pages/admin/AdminMenu.jsx';
import AdminPayment from './pages/admin/AdminPayment.jsx';
import { AdminOrdersSocketProvider } from './context/AdminOrdersSocketContext.jsx';
import { useEffect } from 'react';
import { tryUnlockNotificationSounds } from './utils/notificationSound.js';

export default function App() {
  useEffect(() => {
    let done = false;
    const remove = () => {
      window.removeEventListener('pointerdown', onInteraction, listenerOpts);
      window.removeEventListener('keydown', onInteraction, listenerOpts);
    };
    const maybeUnlock = async () => {
      if (done) return;
      const ok = await tryUnlockNotificationSounds();
      if (!ok) return;
      done = true;
      remove();
    };
    const onInteraction = () => {
      void maybeUnlock();
    };
    const listenerOpts = { capture: true, passive: true };
    window.addEventListener('pointerdown', onInteraction, listenerOpts);
    window.addEventListener('keydown', onInteraction, listenerOpts);
    return () => remove();
  }, []);

  return (
    <AdminOrdersSocketProvider>
      <Toaster
        position="bottom-right"
        gutter={12}
        reverseOrder={false}
        containerStyle={{
          bottom: 24,
          left: 'auto',
          right: 'auto',
          width: '100%',
        }}
        toastOptions={{
          duration: 4000,
          error: {
            icon: null,
            style: {
              background: '#ffffff',
              color: '#0f172a',
              fontWeight: 600,
              borderRadius: '16px',
              padding: '14px 20px',
              maxWidth: 'min(90vw, 22rem)',
              border: '1px solid #e2e8f0',
              boxShadow:
                '0 0 0 1px rgba(252, 128, 25, 0.14), 0 10px 36px -8px rgba(252, 128, 25, 0.38), 0 4px 14px -2px rgba(15, 23, 42, 0.08)',
            },
          },
        }}
      />
      <Navbar />
      <Routes>
        <Route path="/" element={<Menu />} />
        <Route path="/home" element={<Landing />} />
        <Route path="/menu" element={<Menu />} />
        <Route
          path="/cart"
          element={
            <CustomerOnly>
              <Cart />
            </CustomerOnly>
          }
        />
        <Route
          path="/checkout"
          element={
            <CustomerOnly>
              <Checkout />
            </CustomerOnly>
          }
        />
        <Route path="/track" element={<OrderTrack />} />
        <Route path="/admin/login" element={<Login />} />
        <Route
          path="/admin/dashboard"
          element={
            <AdminOnly>
              <Dashboard />
            </AdminOnly>
          }
        />
        <Route
          path="/admin/menu"
          element={
            <AdminOnly>
              <AdminMenu />
            </AdminOnly>
          }
        />
        <Route
          path="/admin/payment"
          element={
            <AdminOnly>
              <AdminPayment />
            </AdminOnly>
          }
        />
      </Routes>
    </AdminOrdersSocketProvider>
  );
}
