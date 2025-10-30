import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import Games from './pages/games/Games.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import { useEffect } from 'react';
import Sidebar from './components/sidebar/Sidebar.jsx';
import SettingsPage from './pages/SettingsPage/SettingsPage.jsx';
import WordmePage from './pages/games/WordmePage.jsx';
import WordmeSettingsPage from './pages/games/WordmeSettingsPage.jsx';

function useAuth() {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  return { token, user: user ? JSON.parse(user) : null };
}

function areClientTokensValid() {
  const t1 = localStorage.getItem('token_login');
  const t2 = localStorage.getItem('token_account');
  const t3 = localStorage.getItem('token_default');
  return Boolean(t1 && t2 && t3);
}

function clearAllAuthAndRedirect(navigate) {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('token_login');
  localStorage.removeItem('token_account');
  localStorage.removeItem('token_default');
  navigate('/login');
}

function TokenGuard() {
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
  const publicPaths = ['/login', '/register', '/settings'];
    if (publicPaths.includes(location.pathname)) {
      // Do not enforce client token presence on public pages
      return;
    }
    const check = () => {
      const jwt = localStorage.getItem('token');
      // If not authenticated, let PrivateRoute handle redirects
      if (!jwt) return;
      // If authenticated but client tokens are missing, force logout
      if (!areClientTokensValid()) clearAllAuthAndRedirect(navigate);
    };
    check();
    const onStorage = (e) => {
      if (!e.key || ['token_login', 'token_account', 'token_default'].includes(e.key)) check();
    };
    const onFocus = () => check();
    const interval = setInterval(check, 2000);
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', onFocus);
      clearInterval(interval);
    };
  }, [navigate, location.pathname]);
  return null;
}

function PrivateRoute({ children }) {
  const { token } = useAuth();
  const validClient = areClientTokensValid();
  return token && validClient ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { token, user } = useAuth();
  const validClient = areClientTokensValid();
  // interpret superadmin as role === 'admin'
  const isSuperAdmin = Boolean(user && user.role === 'admin');
  if (!(token && validClient)) return <Navigate to="/login" replace />;
  return isSuperAdmin ? children : <Navigate to="/games" replace />;
}

export default function App() {
  return (
    <>
      <TokenGuard />
      <div className="app-shell d-flex">
        <Sidebar />
        <main className="app-content flex-grow-1">
          <div className="container my-4">
            <Routes>
              <Route path="/" element={<Navigate to="/games" replace />} />
              <Route path="/games" element={<PrivateRoute><Games /></PrivateRoute>} />
              <Route path="/wordme" element={<PrivateRoute><WordmePage /></PrivateRoute>} />
              <Route path="/wordme/configurações" element={<AdminRoute><WordmeSettingsPage /></AdminRoute>} />
              <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Routes>
          </div>
        </main>
      </div>
    </>
  );
}
