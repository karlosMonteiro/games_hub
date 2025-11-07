import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';


export default function LoginPage({ onAuthChange }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/auth/login', { identifier, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      if (data.tokens) {
        localStorage.setItem('token_login', data.tokens.token_login);
        localStorage.setItem('token_account', data.tokens.token_account);
        localStorage.setItem('token_default', data.tokens.token_default);
      }
  if (onAuthChange) onAuthChange();
  navigate('/games');
    } catch (err) {
      setError(err.response?.data?.error || 'Falha no login');
    }
  }

  return (
    <div className="auth-bg">
      <div className="auth-center">
        <div className="auth-card card shadow-lg">
          <div className="card-body">
            <h2 className="card-title mb-4 text-center gradient-text">Entrar</h2>
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">E-mail, CPF ou Telefone</label>
                <input className="form-control" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Senha</label>
                <div className="input-group">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </button>
                </div>
              </div>
              <button type="submit" className="btn btn-primary w-100 py-2 fs-5">Entrar</button>
            </form>
            <div className="mt-4 text-center">
              <small>Não tem conta? <Link to="/register" className="link-primary">Crie uma</Link></small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
