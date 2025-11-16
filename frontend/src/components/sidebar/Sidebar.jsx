import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { SiHubspot } from 'react-icons/si';
import './Sidebar.scss';
import 'bootstrap-icons/font/bootstrap-icons.css';
import api from '../../api';
import FriendsPanel from '../FriendsPanel/FriendsPanel';

function clearAllAuthAndRedirect(navigate) {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('token_login');
  localStorage.removeItem('token_account');
  localStorage.removeItem('token_default');
  navigate('/login');
}

function useAuth() {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  return { token, user: user ? JSON.parse(user) : null };
}

export default function Sidebar({ onAuthChange }) {
  const navigate = useNavigate();
  const { token, user: userFromStorage } = useAuth();
  if (!token) return null; // hide sidebar when not authenticated
  const [user, setUser] = useState(userFromStorage);
  const [wordmeOpen, setWordmeOpen] = useState(false);
  const [novidadesOpen, setNovidadesOpen] = useState(false);
  const [friendsOpen, setFriendsOpen] = useState(false);
  const isSuperAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!token) return;
    let mounted = true;
    api
      .get('/auth/me')
      .then(({ data }) => {
        if (!mounted) return;
        setUser(data);
        try {
          localStorage.setItem('user', JSON.stringify(data));
        } catch {}
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [token]);

  function logout() {
    clearAllAuthAndRedirect(navigate);
    if (onAuthChange) onAuthChange();
  }

  return (
    <>
      <aside className="app-sidebar">
        <Link to="/" className="brand">
          GamesHub <SiHubspot style={{ fontSize: '1.3em', marginLeft: 9 }} />
        </Link>

      <ul className="nav-list">
        {/* Novidades always on top */}
        {!isSuperAdmin && (
          <li>
            <Link className="nav-link d-flex align-items-center gap-2" to="/novidades">
              <i className="bi bi-newspaper" style={{ fontSize: '1.2em' }}></i>
              Novidades
            </Link>
          </li>
        )}

        {isSuperAdmin && (
          <li>
            <button
              type="button"
              className="nav-link d-flex align-items-center gap-2 w-100 text-start"
              onClick={() => setNovidadesOpen((v) => !v)}
              aria-expanded={novidadesOpen}
              aria-controls="submenu-novidades"
              style={{ background: 'none', border: 0 }}
            >
              <i className="bi bi-newspaper" style={{ fontSize: '1.2em' }}></i>
              Novidades
              <span className="ms-auto">
                <i className={`bi ${novidadesOpen ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
              </span>
            </button>
            {novidadesOpen && (
              <ul id="submenu-novidades" className="submenu list-unstyled ms-4 mt-1">
                <li>
                  <Link className="nav-link d-flex align-items-center gap-2" to="/novidades">
                    <i className="bi bi-eye" style={{ fontSize: '1em' }}></i>
                    Ver Novidades
                  </Link>
                </li>
                <li>
                  <Link className="nav-link d-flex align-items-center gap-2" to="/novidades/configurações">
                    <i className="bi bi-sliders" style={{ fontSize: '1em' }}></i>
                    Configurações
                  </Link>
                </li>
              </ul>
            )}
          </li>
        )}

        <li>
          <Link className="nav-link d-flex align-items-center gap-2" to="/games">
            <i className="bi bi-joystick" style={{ fontSize: '1.2em' }}></i>
            Games
          </Link>
        </li>

        {isSuperAdmin && (
          <li>
            <button
              type="button"
              className="nav-link d-flex align-items-center gap-2 w-100 text-start"
              onClick={() => setWordmeOpen((v) => !v)}
              aria-expanded={wordmeOpen}
              aria-controls="submenu-wordme"
              style={{ background: 'none', border: 0 }}
            >
              <i className="bi bi-grid-3x3-gap" style={{ fontSize: '1.2em' }}></i>
              Wordme
              <span className="ms-auto">
                <i className={`bi ${wordmeOpen ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
              </span>
            </button>
            {wordmeOpen && (
              <ul id="submenu-wordme" className="submenu list-unstyled ms-4 mt-1">
                <li>
                  <Link className="nav-link d-flex align-items-center gap-2" to="/wordme/game">
                    <i className="bi bi-controller" style={{ fontSize: '1em' }}></i>
                    Wordme
                  </Link>
                </li>
                <li>
                  <Link className="nav-link d-flex align-items-center gap-2" to="/wordme/configurações">
                    <i className="bi bi-sliders" style={{ fontSize: '1em' }}></i>
                    Configurações
                  </Link>
                </li>
              </ul>
            )}
          </li>
        )}

        <li>
          <Link className="nav-link d-flex align-items-center gap-2" to="/settings">
            <i className="bi bi-gear-fill" style={{ fontSize: '1.2em' }}></i>
            Configurações
          </Link>
        </li>
      </ul>

      <div className="spacer" />

      <div className="toolbar">
        {token && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              gap: 10,
            }}
          >
            <span className="user-name-inline" style={{ color: 'var(--header-fg)' }}>
              {user?.name ?? ''}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="avatar-button"
                aria-label="Amigos"
                title="Amigos"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setFriendsOpen(!friendsOpen);
                }}
              >
                <i className="bi bi-people-fill" style={{ fontSize: '1.25rem', color: 'var(--header-fg)' }}></i>
              </button>
              <button
                type="button"
                className="avatar-button"
                aria-label="Sair"
                title="Sair"
                onClick={logout}
              >
                <i className="bi bi-arrow-bar-right" style={{ fontSize: '1.25rem', color: 'var(--header-fg)' }}></i>
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
    <FriendsPanel isOpen={friendsOpen} onClose={() => setFriendsOpen(false)} />
    </>
  );
}
