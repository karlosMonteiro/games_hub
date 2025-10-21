import { useEffect, useState } from 'react';
import api from '../api';

export default function DashboardPage() {
  const [me, setMe] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api.get('/auth/me').then(({ data }) => setMe(data)).catch((err) => setError(err.response?.data?.error || 'Erro'));
  }, []);
  return (
    <div>
      <h3>Dashboard</h3>
      {error && <div className="alert alert-danger">{error}</div>}
      {me ? (
        <div className="card">
          <div className="card-body">
            <p><strong>Nome:</strong> {me.firstName} {me.lastName}</p>
            <p><strong>Email:</strong> {me.email}</p>
            <p><strong>CPF:</strong> {me.cpf}</p>
            <p><strong>Telefone:</strong> {me.phone}</p>
          </div>
        </div>
      ) : (
        <p>Carregando...</p>
      )}
    </div>
  );
}
