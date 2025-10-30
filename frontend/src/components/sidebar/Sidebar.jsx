import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { SiHubspot } from 'react-icons/si';
import './Sidebar.scss';
import 'bootstrap-icons/font/bootstrap-icons.css';
import api from '../../api';

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

export default function Sidebar() {
    const navigate = useNavigate();
    const { token, user: userFromStorage } = useAuth();
    const [user, setUser] = useState(userFromStorage);
    const [wordmeOpen, setWordmeOpen] = useState(false);
    const isSuperAdmin = user?.role === 'admin'; // interpret "superadmin" as admin role
    
    useEffect(() => {
        // Refresh user from /auth/me to ensure role is available in localStorage and state
        if (!token) return;
        let mounted = true;
        api.get('/auth/me')
            .then(({ data }) => {
                if (!mounted) return;
                setUser(data);
                try { localStorage.setItem('user', JSON.stringify(data)); } catch {}
            })
            .catch(() => { /* ignore */ });
        return () => { mounted = false; };
    }, [token]);

    async function logout() {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
                    token_login: localStorage.getItem('token_login') || '',
                    token_account: localStorage.getItem('token_account') || '',
                    token_default: localStorage.getItem('token_default') || '',
                },
            });
        } catch { }
        clearAllAuthAndRedirect(navigate);
    }

    

    return (
        <aside className="app-sidebar">
            <Link className="brand" to="/games">
                <span className="brand-title" style={{ fontSize: '2.6rem', fontWeight: 700, lineHeight: 1 }}>
                    Games Hub
                </span>
                <SiHubspot style={{ fontSize: '1.3em', marginLeft: 9 }} />
            </Link>

            <ul className="nav-list">
                {!isSuperAdmin && (
                    <li>
                        <Link className="nav-link d-flex align-items-center gap-2" to="/wordme">
                            <i className="bi bi-grid-3x3-gap" style={{ fontSize: '1.2em' }}></i>
                            Wordme
                        </Link>
                    </li>
                )}

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
                                    <Link className="nav-link d-flex align-items-center gap-2" to="/wordme">
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
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 10 }}>
                        <span className="user-name-inline" style={{ color: 'var(--header-fg)' }}>{user?.name ?? ''}</span>
                        <button type="button" className="avatar-button" aria-label="Sair" title="Sair" onClick={logout}>
                            <i className="bi bi-arrow-bar-right" style={{ fontSize: '1.25rem', color: 'var(--header-fg)' }}></i>
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
}