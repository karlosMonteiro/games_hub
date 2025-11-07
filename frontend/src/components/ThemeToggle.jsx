import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') === 'dark' ? 'dark' : 'light');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  return (
    <button
      type="button"
      onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
      className="btn btn-sm btn-outline-secondary"
      title={theme === 'dark' ? 'Alternar para claro' : 'Alternar para escuro'}
      style={{ borderRadius: 8 }}
    >
      {theme === 'dark' ? '🌙' : '☀️'}
    </button>
  );
}