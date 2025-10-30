import { useEffect, useState } from 'react';
import api from '../../api';

export default function WordmePage() {
  const [me, setMe] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [word, setWord] = useState('');
  const [guess, setGuess] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let mounted = true;
    // Validate session and fetch a word in parallel
    Promise.all([
      api.get('/wordme/me'),
      api.get('/wordme/word'),
    ])
      .then(([meRes, wordRes]) => {
        if (!mounted) return;
        setMe(meRes.data.user);
        setWord(String(wordRes.data.word || '').toUpperCase());
        setError('');
      })
      .catch((err) => { if (mounted) setError(err.response?.data?.error || 'Não autenticado'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  function handleChange(e) {
    // keep only A-Z and uppercase
    const onlyLetters = (e.target.value || '').replace(/[^a-zA-Z]/g, '').toUpperCase();
    setGuess(onlyLetters);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!word) return;
    if ((guess || '').toUpperCase() === word) {
      setMessage('parabéns, você acertou');
    } else {
      setMessage('');
    }
  }

  if (loading) return <p>Carregando…</p>;

  return (
    <div className="container">
      <h3>Wordme</h3>
      {error && <div className="alert alert-danger">{error}</div>}
      {me ? (
        <div className="card">
          <div className="card-body">
            <p>Bem-vindo, <strong>{me.name || me.email}</strong>.</p>
            <p>Seu ID de jogador: <code>{me._id || me.id}</code></p>
            <hr />
            {word && (
              <p> a palavra é <strong>{word}</strong></p>
            )}
            <form className="mt-3" onSubmit={handleSubmit}>
              <div className="input-group">
                <input
                  className="form-control"
                  placeholder="Digite sua tentativa"
                  value={guess}
                  onChange={handleChange}
                  maxLength={word ? word.length : 5}
                />
                <button type="submit" className="btn btn-primary">Enviar</button>
              </div>
            </form>
            {message && <div className="alert alert-success mt-3">{message}</div>}
          </div>
        </div>
      ) : (
        <div className="alert alert-warning">Você precisa estar autenticado.</div>
      )}
    </div>
  );
}
