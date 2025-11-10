import { useEffect, useMemo, useState } from 'react';
import api from '../../../api';

function LenSelector({ value, onChange }) {
  return (
    <div className="btn-group" role="group" aria-label="Tamanho da palavra">
      {[5,6,7].map((n) => (
        <button key={n} type="button" className={`btn btn-sm ${value===n?'btn-primary':'btn-outline-primary'}`} onClick={() => onChange(n)}>
          {n} letras
        </button>
      ))}
    </div>
  );
}

function WordRow({ item, onEdit, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(item.word);
  const startEdit = () => { setEditing(true); setText(item.word); };
  const cancel = () => { setEditing(false); setText(item.word); };
  const save = async () => { await onEdit(item.id, text); setEditing(false); };
  return (
    <li className="list-group-item d-flex align-items-center justify-content-between">
      {!editing ? (
        <span className="fw-semibold" style={{ letterSpacing: 1 }}>{item.word}</span>
      ) : (
        <input className="form-control form-control-sm" value={text} onChange={(e)=>setText(e.target.value)} style={{ maxWidth: 240 }} />
      )}
      <div className="d-flex align-items-center gap-2">
        {!editing ? (
          <>
            <button className="btn btn-sm btn-outline-secondary" title="Editar" onClick={startEdit}><i className="bi bi-pencil"></i></button>
            <button className="btn btn-sm btn-outline-danger" title="Remover" onClick={() => onDelete(item.id)}><i className="bi bi-trash"></i></button>
          </>
        ) : (
          <>
            <button className="btn btn-sm btn-primary" onClick={save}>Salvar</button>
            <button className="btn btn-sm btn-light" onClick={cancel}>Cancelar</button>
          </>
        )}
      </div>
    </li>
  );
}

export default function WordmeSettingsPage() {
  const [len, setLen] = useState(5);
  const [search, setSearch] = useState('');
  const [list, setList] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [stats, setStats] = useState({ words5: 0, words6: 0, words7: 0, total: 0 });
  const [newWord, setNewWord] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const canSubmitWord = useMemo(() => {
    const w = (newWord||'').trim().toLowerCase();
    return /^[a-z]+$/.test(w) && w.length>=5 && w.length<=7;
  }, [newWord]);

  async function fetchList() {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/wordme/words', { params: { length: len, search, page: pagination.page } });
      setList(data.list || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (e) {
      setError(e.response?.data?.error || 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  }

  async function fetchStats() {
    try {
      const { data } = await api.get('/wordme/words/stats');
      setStats(data);
    } catch (e) {
      console.error('Erro ao buscar estatísticas:', e);
    }
  }

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => { setPagination(prev => ({ ...prev, page: 1 })); }, [len, search]);
  useEffect(() => { fetchList(); /* eslint-disable-next-line */ }, [len, search, pagination.page]);

  async function addWord(e) {
    e.preventDefault();
    if (!canSubmitWord) return;
    try {
      await api.post('/wordme/words', { word: newWord });
      setNewWord('');
      fetchList();
      fetchStats();
    } catch (e) {
      setError(e.response?.data?.error || 'Erro ao adicionar');
    }
  }

  async function editWord(id, text) {
    try {
      await api.patch(`/wordme/words/${id}`, { newWord: text });
      fetchList();
      fetchStats();
    } catch (e) {
      setError(e.response?.data?.error || 'Erro ao salvar');
    }
  }

  async function deleteWord(id) {
    try {
      await api.delete(`/wordme/words/${id}`);
      fetchList();
      fetchStats();
    } catch (e) {
      setError(e.response?.data?.error || 'Erro ao remover');
    }
  }

  return (
    <div>
      <h3 className="mb-3">Wordme – Configurações</h3>
      
      {/* Stats */}
      <div className="alert alert-info d-flex justify-content-around mb-3">
        <div><strong>5 letras:</strong> {stats.words5} palavras</div>
        <div><strong>6 letras:</strong> {stats.words6} palavras</div>
        <div><strong>7 letras:</strong> {stats.words7} palavras</div>
        <div><strong>Total:</strong> {stats.total} palavras</div>
      </div>
      
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="card">
        <div className="card-body">
          <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
            <LenSelector value={len} onChange={setLen} />
            <input className="form-control" placeholder="Filtrar (prefixo)" value={search} onChange={(e)=>setSearch(e.target.value)} style={{ maxWidth: 240 }} />
          </div>

          <form onSubmit={addWord} className="d-flex align-items-center gap-2 mb-3">
            <input
              className="form-control"
              placeholder="Adicionar palavra (5-7 letras, sem acentos)"
              value={newWord}
              onChange={(e)=>setNewWord(e.target.value)}
              style={{ maxWidth: 360 }}
            />
            <button type="submit" className="btn btn-primary" disabled={!canSubmitWord}>Adicionar</button>
          </form>

          {loading ? (
            <div className="text-muted">Carregando...</div>
          ) : (
            <>
              <ul className="list-group">
                {list.map((item) => (
                  <WordRow key={item.id} item={item} onEdit={editWord} onDelete={deleteWord} />
                ))}
                {list.length === 0 && <li className="list-group-item text-muted">Sem palavras cadastradas.</li>}
              </ul>
              
              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div className="text-muted">
                    Página {pagination.page} de {pagination.totalPages} ({pagination.total} palavras)
                  </div>
                  <div className="btn-group">
                    <button 
                      className="btn btn-sm btn-outline-primary" 
                      disabled={!pagination.hasPrev}
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    >
                      ← Anterior
                    </button>
                    <button 
                      className="btn btn-sm btn-outline-primary" 
                      disabled={!pagination.hasNext}
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    >
                      Próxima →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
