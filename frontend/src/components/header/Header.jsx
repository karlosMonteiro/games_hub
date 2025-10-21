import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import './Header.scss';
import 'bootstrap-icons/font/bootstrap-icons.css';

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

export default function Header() {
	const navigate = useNavigate();
	const { user } = useAuth();
	const [open, setOpen] = useState(false);
	const menuRef = useRef(null);
	const [theme, setTheme] = useState(document.documentElement.getAttribute('data-theme') || 'light');

	async function logout() {
		try { await fetch('/api/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('token')||''}`, 'token_login': localStorage.getItem('token_login')||'', 'token_account': localStorage.getItem('token_account')||'', 'token_default': localStorage.getItem('token_default')||'' } }); } catch {}
		clearAllAuthAndRedirect(navigate);
	}

	useEffect(() => {
		function onDocClick(e) {
			if (!menuRef.current) return;
			if (!menuRef.current.contains(e.target)) setOpen(false);
		}
		document.addEventListener('click', onDocClick);
		return () => document.removeEventListener('click', onDocClick);
	}, []);

		useEffect(() => {
			document.documentElement.setAttribute('data-theme', theme);
		}, [theme]);

		function toggleTheme() {
			setTheme((t) => (t === 'light' ? 'dark' : 'light'));
		}

	const initials = user ? `${(user.firstName?.[0]||'').toUpperCase()}${(user.lastName?.[0]||'').toUpperCase()}` || 'U' : '';
	return (
		<nav className="navbar navbar-expand-lg navbar-dark app-navbar">
			<div className="container-fluid">
				<Link className="navbar-brand ps-2" to="/games">Games Hub</Link>
						<div className="collapse navbar-collapse">
					<ul className="navbar-nav ms-auto">
								<li className="nav-item d-flex align-items-center">
									<button className="theme-toggle" onClick={toggleTheme} title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}>
										{theme === 'dark' ? (
											<i className="bi bi-sun-fill"></i>
										) : (
											<i className="bi bi-moon-stars-fill"></i>
										)}
									</button>
								</li>
						{user ? (
							<li className="nav-item dropdown" ref={menuRef} style={{ position: 'relative' }}>
								<div className="d-flex align-items-center gap-3">
									<button
										type="button"
										className="avatar-button"
										aria-label="Abrir menu do usuário"
										onClick={() => setOpen((v) => !v)}
									>
										<div className="avatar-circle">{initials}</div>
									</button>
								</div>
								{open && (
									<div className="dropdown-panel">
										<button className="dropdown-item" onClick={() => { setOpen(false); navigate('/profile'); }}>Perfil</button>
										<div className="dropdown-divider" />
										<button className="dropdown-item text-danger" onClick={logout}>Sair</button>
									</div>
								)}
							</li>
						) : (
							<>
								<li className="nav-item"><Link className="nav-link" to="/login">Login</Link></li>
								<li className="nav-item"><Link className="nav-link" to="/register">Criar conta</Link></li>
							</>
						)}
					</ul>
				</div>
			</div>
		</nav>
	);
}

