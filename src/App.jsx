import { Routes, Route } from 'react-router-dom';
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

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
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
      </Routes>
    </>
  );
}
