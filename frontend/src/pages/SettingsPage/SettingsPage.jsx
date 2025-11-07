import { useEffect, useState } from 'react';
import api from '../../api';

export default function SettingsPage() {
  const [theme, setTheme] = useState(() => document.documentElement.getAttribute('data-theme') || 'light');

  useEffect(() => {
    // Initialize from user profile
    try {
      const raw = localStorage.getItem('user');
      const user = raw ? JSON.parse(raw) : null;
      const t = user?.theme === 'dark' ? 'dark' : 'light';
      setTheme(t);
      if (t === 'dark') document.documentElement.setAttribute('data-theme', 'dark'); else document.documentElement.removeAttribute('data-theme');
    } catch {}
  }, []);

  useEffect(() => {
    if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark'); else document.documentElement.removeAttribute('data-theme');
  }, [theme]);

  const toggleTheme = async () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    try {
      await api.patch('/auth/theme', { theme: next });
      // Update cached user object
      const raw = localStorage.getItem('user');
      if (raw) {
        const user = JSON.parse(raw);
        user.theme = next;
        localStorage.setItem('user', JSON.stringify(user));
      }
    } catch (e) {
      console.error('Falha ao atualizar tema', e);
    }
  };

  return (
    <div className="card">
      <div className="card-body">
        <h3 className="card-title mb-3">Configurações</h3>
        <div className="d-flex align-items-center justify-content-between">
          <div>
            <div className="fw-semibold">Tema</div>
            <small className="settings-subtitle">Altere o tema do aplicativo</small>
          </div>
          <button type="button" className="btn btn-outline-secondary" onClick={toggleTheme} aria-label="Alternar tema">
            {theme === 'dark' ? '☀️ Claro' : '🌙 Escuro'}
          </button>
        </div>
      </div>
    </div>
  );
}
