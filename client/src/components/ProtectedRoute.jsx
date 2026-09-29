import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Loader } from './ui.jsx';

export default function ProtectedRoute({ children, admin = false, superAdmin = false }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <Loader />;
  if (!user) return <Navigate to={admin ? '/admin/login' : '/login'} state={{ from: loc.pathname }} replace />;
  if (admin && user.role === 'USER') return <Navigate to="/admin/login" replace />;
  if (!admin && user.role !== 'USER') return <Navigate to="/admin/dashboard" replace />;
  if (superAdmin && user.role !== 'SUPER_ADMIN') return <Navigate to="/admin/dashboard" replace />;
  return children;
}
