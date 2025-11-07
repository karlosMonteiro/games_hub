import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import Games from './pages/games/Games.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import { useEffect, useState } from 'react';
import Sidebar from './components/sidebar/Sidebar.jsx';
import SettingsPage from './pages/SettingsPage/SettingsPage.jsx';
import WordmeGame from './pages/games/wordme/WordmeGame.jsx';
import WordmeSettingsPage from './pages/games/wordme/WordmeSettingsPage.jsx';

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

function getJwtExpMs() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    // base64url decode
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const obj = JSON.parse(json);
    if (!obj.exp) return null;
    return obj.exp * 1000; // seconds -> ms
  } catch {
    return null;
  }
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
      // Also enforce JWT exp: if expired, logout
      const expMs = getJwtExpMs();
      if (expMs && Date.now() >= expMs) {
        clearAllAuthAndRedirect(navigate);
      }
    };
    check();
    const onStorage = (e) => {
      if (!e.key || ['token_login', 'token_account', 'token_default'].includes(e.key)) check();
    };
    const onFocus = () => check();
    const interval = setInterval(check, 1000);
    // Optional: schedule a precise timeout to logout exactly at exp
    const expMs = getJwtExpMs();
    let timeoutId = null;
    if (expMs) {
      const delay = expMs - Date.now();
      if (delay > 0 && delay < 24 * 60 * 60 * 1000) {
        timeoutId = setTimeout(() => clearAllAuthAndRedirect(navigate), delay);
      }
    }
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', onFocus);
      clearInterval(interval);
      if (timeoutId) clearTimeout(timeoutId);
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
  const [authVersion, setAuthVersion] = useState(0);
  const { token } = useAuth();
  const validClient = areClientTokensValid();
  const isAuthenticated = Boolean(token && validClient);
  // Callback to force re-render after login/logout
  const refreshAuth = () => setAuthVersion((v) => v + 1);
  // Theme: prefer authenticated user's theme; fallback to light on logout
  useEffect(() => {
    const u = localStorage.getItem('user');
    const user = u ? JSON.parse(u) : null;
    const theme = user?.theme === 'dark' ? 'dark' : 'light';
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [authVersion]);

  return (
    <>
      <TokenGuard />
      <div className="app-shell d-flex">
  {isAuthenticated && <Sidebar key={authVersion} onAuthChange={refreshAuth} />}
        <main className="app-content flex-grow-1">
          <div className="container my-4">
            <Routes>
              <Route path="/" element={<Navigate to="/games" replace />} />
              <Route path="/games" element={<PrivateRoute><Games /></PrivateRoute>} />
              <Route path="/wordme/game" element={<PrivateRoute><WordmeGame /></PrivateRoute>} />
              <Route path="/wordme/configurações" element={<AdminRoute><WordmeSettingsPage /></AdminRoute>} />
              <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/login" element={<LoginPage onAuthChange={refreshAuth} />} />
              <Route path="/register" element={<RegisterPage onAuthChange={refreshAuth} />} />
            </Routes>
          </div>
        </main>
      </div>
    </>
  );
}
