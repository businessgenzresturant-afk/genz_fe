import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/** Only owners can access admin routes */
export default function AdminOnly({ children }) {
  const { token, isAdmin, authReady } = useAuth();
  if (!authReady) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-slate-600">
        Loading…
      </div>
    );
  }
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  return children;
}
