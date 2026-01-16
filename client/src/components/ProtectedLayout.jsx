import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const ProtectedLayout = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div className="p-10">Loading...</div>;

  return user ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedLayout;