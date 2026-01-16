import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthProvider } from './context/AuthContext';
import AuthContext from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import LandingPage from './pages/LandingPage';
import ProtectedLayout from './components/ProtectedLayout';
import BoardView from './pages/BoardView';

// Helper component to redirect logged-in users away from Auth pages
const PublicRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  
  if (loading) return <div>Loading...</div>;
  if (user) return <Navigate to="/dashboard" />;
  
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes (Accessible only if NOT logged in) */}
          <Route path="/" element={
            <PublicRoute>
              <LandingPage />
            </PublicRoute>
          } />
          
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          
          <Route path="/register" element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } />
          
          {/* Protected Routes (Accessible only if logged in) */}
          <Route element={<ProtectedLayout />}>
            {/* Phase 5: Board Route will go here */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/board/:id" element={<BoardView />} />
          </Route>

          {/* Catch all - Send to Landing */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;