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
      const { data } = await api.get('/wordme/words', { params: { length: len, search } });
      setList(data);
    } catch (e) {
      setError(e.response?.data?.error || 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchList(); /* eslint-disable-next-line */ }, [len, search]);

  async function addWord(e) {
    e.preventDefault();
    if (!canSubmitWord) return;
    try {
      const { data } = await api.post('/wordme/words', { word: newWord });
      setNewWord('');
      // If new word length matches current len, prepend
      if (data.word?.length === len) setList((prev) => [{ id: data.id, word: data.word }, ...prev]);
    } catch (e) {
      setError(e.response?.data?.error || 'Erro ao adicionar');
    }
  }

  async function editWord(id, text) {
    try {
      const { data } = await api.patch(`/wordme/words/${id}`, { newWord: text });
      // If length changed, remove from current list; else update
      if (data.word.length !== len) setList((prev) => prev.filter((x) => x.id !== id));
      else setList((prev) => prev.map((x) => x.id === id ? { id, word: data.word } : x));
    } catch (e) {
      setError(e.response?.data?.error || 'Erro ao salvar');
    }
  }

  async function deleteWord(id) {
    try {
      await api.delete(`/wordme/words/${id}`);
      setList((prev) => prev.filter((x) => x.id !== id));
    } catch (e) {
      setError(e.response?.data?.error || 'Erro ao remover');
    }
  }

  return (
    <div>
      <h3 className="mb-3">Wordme – Configurações</h3>
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
            <ul className="list-group">
              {list.map((item) => (
                <WordRow key={item.id} item={item} onEdit={editWord} onDelete={deleteWord} />
              ))}
              {list.length === 0 && <li className="list-group-item text-muted">Sem palavras cadastradas.</li>}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
