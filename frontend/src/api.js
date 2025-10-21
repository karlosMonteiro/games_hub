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

export default api;
