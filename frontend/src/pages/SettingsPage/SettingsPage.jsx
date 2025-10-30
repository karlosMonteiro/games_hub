import { useEffect, useState } from 'react';

export default function SettingsPage() {
  const [theme, setTheme] = useState(() => document.documentElement.getAttribute('data-theme') || 'light');

  useEffect(() => {
    // Initialize from localStorage or system preference
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') {
      setTheme(stored);
      document.documentElement.setAttribute('data-theme', stored);
      return;
    }
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = prefersDark ? 'dark' : 'light';
    setTheme(initial);
    document.documentElement.setAttribute('data-theme', initial);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

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
