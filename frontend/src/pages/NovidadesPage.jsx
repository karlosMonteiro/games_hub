import { useEffect, useState } from 'react';
import api from '../api';
import './style/NovidadesPage.scss';

export default function NovidadesPage() {
  const [novidades, setNovidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNovidades();
  }, []);

  async function fetchNovidades() {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/novidades');
      setNovidades(data);
    } catch (e) {
      setError(e.response?.data?.error || 'Erro ao carregar novidades');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="novidades-page">
        <div className="text-center text-muted">Carregando novidades...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="novidades-page">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  return (
    <div className="novidades-page">
      <div className="novidades-header">
        <h2 className="novidades-title">Novidades</h2>
        <p className="novidades-subtitle">Fique por dentro das últimas atualizações!</p>
      </div>

      <div className="novidades-list">
        {novidades.length === 0 ? (
          <div className="empty-state">
            <i className="bi bi-newspaper"></i>
            <p>Nenhuma novidade no momento</p>
          </div>
        ) : (
          novidades.map((item) => (
            <div key={item._id} className="novidade-card">
              <div className="novidade-header">
                <span className="novidade-badge">{item.category || 'Geral'}</span>
                <span className="novidade-date">
                  {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <h3 className="novidade-title">{item.title}</h3>
              <p className="novidade-content">{item.content}</p>
              {item.tags && item.tags.length > 0 && (
                <div className="novidade-tags">
                  {item.tags.map((tag, idx) => (
                    <span key={idx} className="tag">#{tag}</span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
