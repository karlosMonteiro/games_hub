import { useEffect, useState } from 'react';
import api from '../api';
import './style/NovidadesConfigPage.scss';

export default function NovidadesConfigPage() {
  const [novidades, setNovidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'Geral',
    tags: ''
  });

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

  function resetForm() {
    setFormData({ title: '', content: '', category: 'Geral', tags: '' });
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(item) {
    setFormData({
      title: item.title,
      content: item.content,
      category: item.category || 'Geral',
      tags: item.tags ? item.tags.join(', ') : ''
    });
    setEditingId(item._id);
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
      };

      if (editingId) {
        await api.patch(`/novidades/${editingId}`, payload);
      } else {
        await api.post('/novidades', payload);
      }

      resetForm();
      fetchNovidades();
    } catch (e) {
      setError(e.response?.data?.error || 'Erro ao salvar novidade');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Deseja realmente excluir esta novidade?')) return;
    setError('');
    try {
      await api.delete(`/novidades/${id}`);
      fetchNovidades();
    } catch (e) {
      setError(e.response?.data?.error || 'Erro ao excluir novidade');
    }
  }

  return (
    <div className="novidades-config-page">
      <div className="config-header">
        <h2>Gerenciar Novidades</h2>
        {!showForm && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <i className="bi bi-plus-circle"></i> Nova Novidade
          </button>
        )}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {showForm && (
        <div className="form-card">
          <div className="form-header">
            <h4>{editingId ? 'Editar Novidade' : 'Nova Novidade'}</h4>
            <button className="btn btn-sm btn-light" onClick={resetForm}>
              <i className="bi bi-x"></i>
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Título</label>
              <input
                type="text"
                className="form-control"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Conteúdo</label>
              <textarea
                className="form-control"
                rows="5"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                required
              ></textarea>
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Categoria</label>
                <select
                  className="form-select"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="Geral">Geral</option>
                  <option value="Jogos">Jogos</option>
                  <option value="Atualização">Atualização</option>
                  <option value="Evento">Evento</option>
                  <option value="Manutenção">Manutenção</option>
                </select>
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Tags (separadas por vírgula)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="novidade, importante"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                />
              </div>
            </div>
            <div className="d-flex gap-2">
              <button type="submit" className="btn btn-primary">
                {editingId ? 'Salvar Alterações' : 'Publicar'}
              </button>
              <button type="button" className="btn btn-light" onClick={resetForm}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center text-muted mt-4">Carregando...</div>
      ) : (
        <div className="novidades-list mt-4">
          {novidades.length === 0 ? (
            <div className="empty-state">Nenhuma novidade cadastrada</div>
          ) : (
            novidades.map((item) => (
              <div key={item._id} className="novidade-item">
                <div className="novidade-content">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <h5 className="mb-1">{item.title}</h5>
                      <small className="text-muted">
                        {new Date(item.createdAt).toLocaleDateString('pt-BR')} • {item.category}
                      </small>
                    </div>
                    <div className="btn-group">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => startEdit(item)}
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(item._id)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                  <p className="mb-2">{item.content}</p>
                  {item.tags && item.tags.length > 0 && (
                    <div className="tags">
                      {item.tags.map((tag, idx) => (
                        <span key={idx} className="badge bg-secondary me-1">#{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
