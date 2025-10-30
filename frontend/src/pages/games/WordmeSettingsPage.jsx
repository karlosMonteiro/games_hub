import { useEffect, useState } from 'react';
import api from '../../api';

export default function WordmeSettingsPage() {
  const [me, setMe] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/auth/me').then(({ data }) => setMe(data)).catch((err) => setError(err.response?.data?.error || 'Erro'));
  }, []);

  return (
    <div>
      <h3 className="mb-3">Wordme – Configurações</h3>
      {error && <div className="alert alert-danger">{error}</div>}
      <p className="text-muted">Somente superadmin (admin) pode ver esta página.</p>
      {me && (
        <div className="card">
          <div className="card-body">
            <div className="mb-2"><strong>Usuário:</strong> {me.name} ({me.email})</div>
            <div className="mb-2"><strong>Role:</strong> {me.role}</div>
            <hr />
            <p className="mb-0">Coloque aqui opções do jogo (ex.: dicionário ativo, limites, etc.).</p>
          </div>
        </div>
      )}
    </div>
  );
}
