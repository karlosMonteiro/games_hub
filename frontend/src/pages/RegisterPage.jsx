import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

export default function RegisterPage() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    cpf: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (form.password !== form.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }
    try {
      await api.post('/auth/register', form);
      setSuccess('Conta criada com sucesso! Você já pode entrar.');
      setTimeout(() => navigate('/login'), 1000);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar conta');
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-md-8 col-lg-7">
        <div className="card shadow-sm">
          <div className="card-body">
            <h3 className="card-title mb-3">Criar conta</h3>
            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Nome</label>
                  <input name="firstName" className="form-control" value={form.firstName} onChange={handleChange} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Sobrenome</label>
                  <input name="lastName" className="form-control" value={form.lastName} onChange={handleChange} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">E-mail</label>
                  <input type="email" name="email" className="form-control" value={form.email} onChange={handleChange} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">CPF</label>
                  <input name="cpf" className="form-control" value={form.cpf} onChange={handleChange} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Telefone</label>
                  <input name="phone" className="form-control" value={form.phone} onChange={handleChange} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Senha</label>
                  <input type="password" name="password" className="form-control" value={form.password} onChange={handleChange} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Repetir senha</label>
                  <input type="password" name="confirmPassword" className="form-control" value={form.confirmPassword} onChange={handleChange} required />
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
