import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

export default function RegisterPage({ onAuthChange }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    cpf: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  // Helpers to format and validate CPF/Phone
  const onlyDigits = (v) => (v || '').replace(/\D+/g, '');
  const formatCPF = (v) => {
    const d = onlyDigits(v).slice(0, 11);
    const part1 = d.slice(0, 3);
    const part2 = d.slice(3, 6);
    const part3 = d.slice(6, 9);
    const part4 = d.slice(9, 11);
    let out = '';
    if (part1) out = part1;
    if (part2) out += '.' + part2;
    if (part3) out += '.' + part3;
    if (part4) out += '-' + part4;
    return out;
  };
  const validateCPF = (v) => {
    const cpf = onlyDigits(v);
    if (cpf.length !== 11) return false;
    // invalid known sequences
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    // calc first digit
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(cpf[i], 10) * (10 - i);
    let first = (sum * 10) % 11;
    if (first === 10) first = 0;
    if (first !== parseInt(cpf[9], 10)) return false;
    // calc second digit
    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(cpf[i], 10) * (11 - i);
    let second = (sum * 10) % 11;
    if (second === 10) second = 0;
    if (second !== parseInt(cpf[10], 10)) return false;
    return true;
  };
  const formatPhone = (v) => {
    const d = onlyDigits(v).slice(0, 11);
    if (d.length === 0) return '';
    if (d.length < 3) return d; // Parênteses só aparecem a partir de 3 dígitos
    // Quando já temos DDD completo e pelo menos mais 1 dígito, formatamos
    const ddd = d.slice(0, 2);
    const n1 = d.slice(2, 3);
    const n2 = d.slice(3, 7);
    const n3 = d.slice(7, 11);
    let out = `(${ddd})`;
    if (n1) out += ` ${n1}`;
    if (n2) out += ` ${n2}`;
    if (n3) out += `-${n3}`;
    return out;
  };

  function handleChange(e) {
    const { name, value } = e.target;
    if (name === 'cpf') {
      setForm({ ...form, cpf: formatCPF(value) });
    } else if (name === 'phone') {
      setForm({ ...form, phone: formatPhone(value) });
    } else {
      setForm({ ...form, [name]: value });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitted(true);
    setError('');
    setSuccess('');
    // Validate phone: must have exactly 11 digits (Brazilian mobile with DDD)
    const phoneDigits = onlyDigits(form.phone);
    if (phoneDigits.length !== 11) {
      setError('Telefone inválido. Use o formato (00) 0 0000-0000');
      return;
    }
    // Validate CPF with checksum
    if (!validateCPF(form.cpf)) {
      setError('CPF inválido. Use o formato 000.000.000-00');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }
    try {
      await api.post('/auth/register', form);
  setSuccess('Conta criada com sucesso! Você já pode entrar.');
  if (onAuthChange) onAuthChange();
  setTimeout(() => navigate('/login'), 1000);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar conta');
    }
  }

  return (
    <div className="auth-bg">
      <div className="auth-center">
        <div className="auth-card card shadow-lg">
          <div className="card-body">
            <h2 className="card-title mb-4 text-center gradient-text">Criar conta</h2>
            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Nome completo</label>
                  <input name="name" className="form-control" value={form.name} onChange={handleChange} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Telefone</label>
                  <input
                    type="tel"
                    name="phone"
                    className="form-control"
                    placeholder="(00) 0 0000-0000"
                    value={form.phone}
                    onChange={handleChange}
                    inputMode="numeric"
                    maxLength={16}
                    title="Formato: (00) 0 0000-0000"
                    autoComplete="tel"
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">E-mail</label>
                  <input type="email" name="email" className="form-control" value={form.email} onChange={handleChange} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">CPF</label>
                  <input
                    name="cpf"
                    className="form-control"
                    placeholder="000.000.000-00"
                    value={form.cpf}
                    onChange={handleChange}
                    inputMode="numeric"
                    maxLength={14}
                    title="Formato: 000.000.000-00"
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Senha</label>
                  <div className="input-group">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      className={`form-control ${submitted && form.password !== form.confirmPassword ? 'is-invalid' : ''}`}
                      value={form.password}
                      onChange={handleChange}
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
                  {submitted && form.password !== form.confirmPassword && (
                    <div className="invalid-feedback d-block">As senhas não coincidem</div>
                  )}
                </div>
                <div className="col-md-6">
                  <label className="form-label">Repetir senha</label>
                  <div className="input-group">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      className={`form-control ${submitted && form.password !== form.confirmPassword ? 'is-invalid' : ''}`}
                      value={form.confirmPassword}
                      onChange={handleChange}
                      required
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      title={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                    </button>
                  </div>
                  {submitted && form.password !== form.confirmPassword && (
                    <div className="invalid-feedback d-block">As senhas não coincidem</div>
                  )}
                </div>
              </div>
              <button type="submit" className="btn btn-primary w-100 mt-3">Criar conta</button>
            </form>
            <div className="mt-3">
              <small>Já tem conta? <Link to="/login">Entrar</Link></small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
