import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const tLogin = localStorage.getItem('token_login');
  const tAcc = localStorage.getItem('token_account');
  const tDef = localStorage.getItem('token_default');
  if (tLogin) config.headers['token_login'] = tLogin;
  if (tAcc) config.headers['token_account'] = tAcc;
  if (tDef) config.headers['token_default'] = tDef;
  return config;
});

function forceLogoutToLogin() {
  try { localStorage.removeItem('token'); } catch {}
  try { localStorage.removeItem('user'); } catch {}
  try { localStorage.removeItem('token_login'); } catch {}
  try { localStorage.removeItem('token_account'); } catch {}
  try { localStorage.removeItem('token_default'); } catch {}
  // Hard redirect to clear any in-memory state
  if (window.location.pathname !== '/login') window.location.href = '/login';
}

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      // Any 401 from main or game backends -> logout
      forceLogoutToLogin();
    }
    return Promise.reject(error);
  }
);

export default api;
