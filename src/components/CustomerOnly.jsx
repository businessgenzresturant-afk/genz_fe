import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/** Redirects owners away from customer shopping routes (cart / checkout). */
export default function CustomerOnly({ children }) {
  const { isAdmin } = useAuth();
  if (isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return children;
}
