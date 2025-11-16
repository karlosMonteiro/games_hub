import { useEffect, useState } from 'react';
import api from '../../../api';
import './styles/WordmeGame.scss';

export default function WordmeGame() {
  // Grid & selection
  const [grid, setGrid] = useState(() => Array.from({ length: 6 }, () => Array(5).fill('')));
  const [evalGrid, setEvalGrid] = useState(() => Array.from({ length: 6 }, () => Array(5).fill(null))); // null|correct|present|absent
  const [currentRow, setCurrentRow] = useState(0);
  const [currentCol, setCurrentCol] = useState(0);
  const [revealingRow, setRevealingRow] = useState(null); // Linha sendo revelada
  const [revealedCols, setRevealedCols] = useState([]); // Colunas já reveladas

  // Game session
  const [gameId, setGameId] = useState(null);
  const [status, setStatus] = useState('in_progress'); // in_progress|won|lost
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Init game
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.post('/wordme/game');
        if (!cancelled) setGameId(data.gameId);
      } catch (e) {
        if (!cancelled) setMessage('erro ao iniciar jogo');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Input handlers
  const handleInput = (ch) => {
    const letter = (ch || '').toString().trim().toUpperCase();
    if (!letter.match(/^[A-Z]$/)) return;
    if (status !== 'in_progress') return;
    setGrid(prev => {
      const row = [...prev[currentRow]];
      if (currentCol > 4) return prev; // full row
      row[currentCol] = letter; // overwrite allowed
      const next = prev.map((r,i)=> i===currentRow ? row : r);
      return next;
    });
    setCurrentCol(c => c < 4 ? c + 1 : c);
    setMessage('');
  };

  const handleBackspace = () => {
    if (status !== 'in_progress') return;
    setGrid(prev => {
      const row = [...prev[currentRow]];
      let col = currentCol;
      if (col > 0 && !row[col]) col = col - 1; // move left if empty
      if (row[col]) row[col] = '';
      const next = prev.map((r,i)=> i===currentRow ? row : r);
      return next;
    });
    setCurrentCol(c => c > 0 ? c - 1 : 0);
    setMessage('');
  };

  const handleEnter = async () => {
    if (status !== 'in_progress') return;
    const word = grid[currentRow].join('');
    if (word.length < 5) return; // incomplete row
    if (!gameId) return;
    if (submitting || revealingRow !== null) return; // Bloqueia durante animação

    setSubmitting(true);
    try {
      const { data } = await api.post('/wordme/guess', { gameId, word });
      const evaluation = data.evaluation || [];
      
      // Inicia animação de revelação
      setRevealingRow(currentRow);
      setRevealedCols([]);

      // Revela letra por letra com delay
      evaluation.forEach((e, colIndex) => {
        setTimeout(() => {
          setRevealedCols(prev => [...prev, colIndex]);
          setEvalGrid(prevEval => {
            const newEval = prevEval.map((r, i) => 
              i === currentRow 
                ? r.map((cell, c) => c === colIndex ? e.state : cell)
                : r
            );
            return newEval;
          });

          // Quando última letra for revelada
          if (colIndex === 4) {
            setTimeout(() => {
              setRevealingRow(null);
              setRevealedCols([]);
              setStatus(data.status || 'in_progress');
              setMessage('');
              
              if (data.status === 'in_progress') {
                setCurrentRow(r => r + 1);
                setCurrentCol(0);
              }
              setSubmitting(false);
            }, 400); // Aguarda animação terminar
          }
        }, colIndex * 150); // 150ms entre cada letra
      });

    } catch (e) {
      const code = e?.response?.status;
      if (code === 422) setMessage('essa palavra não é aceita');
      else if (code === 404) setMessage('jogo não encontrado');
      else if (code === 400) setMessage(e?.response?.data?.error || 'erro');
      else setMessage('falha ao enviar tentativa');
      setSubmitting(false);
      setRevealingRow(null);
      setRevealedCols([]);
    }
  };

  // Physical keyboard support
  useEffect(() => {
    const onKeyDown = (e) => {
      const key = e.key;
      if (/^[a-zA-Z]$/.test(key)) {
        e.preventDefault();
        handleInput(key);
      } else if (key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (key === 'Enter') {
        e.preventDefault();
        handleEnter();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentRow, currentCol, grid, status, gameId]);

  return (
    <div className="wordme-game-bg">
      <div className="wordme-game-container">
        <div className="wordme-header">
          <h3 className="wordme-title gradient-text">Wordme</h3>
          <button className="wordme-settings-btn" title="Configurações do jogo">
            <i className="bi bi-gear-fill"></i>
          </button>
        </div>

        <div className="wordme-blocks-grid">
          {grid.map((rowArr, rowIdx) => (
            <div className="wordme-blocks-row" key={rowIdx}>
              {rowArr.map((value, colIdx) => {
                const isSelected = rowIdx === currentRow && colIdx === currentCol;
                const isActiveRow = rowIdx === currentRow;
                const state = evalGrid[rowIdx][colIdx];
                const isRevealing = revealingRow === rowIdx && revealedCols.includes(colIdx);
                
                return (
                  <div
                    key={colIdx}
                    className={`wordme-block ${isSelected ? 'wordme-block--selected' : ''} ${state ? 'wordme-block--' + state : ''} ${isRevealing ? 'wordme-block--revealing' : ''}`}
                    onClick={() => { if (rowIdx === currentRow) setCurrentCol(colIdx); }}
                    style={isActiveRow ? { cursor: 'pointer' } : undefined}
                  >
                    {value && <span className="wordme-block-center">{value}</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {message && (
          <div className="wordme-inline-message" role="alert">{message}</div>
        )}

        <div className="wordme-keyboard">
          <div className="wordme-keyboard-row">
            {'QWERTYUIOP'.split('').map(k => (
              <button key={k} type="button" className="wordme-key" onClick={() => handleInput(k)}>{k}</button>
            ))}
          </div>
          <div className="wordme-keyboard-row">
            {'ASDFGHJKL'.split('').map(k => (
              <button key={k} type="button" className="wordme-key" onClick={() => handleInput(k)}>{k}</button>
            ))}
            <button className="wordme-key wordme-key--backspace" type="button" onClick={handleBackspace}>⌫</button>
          </div>
          <div className="wordme-keyboard-row wordme-keyboard-row--offset3">
            <span style={{ marginLeft: '18px' }}>
              <button className="wordme-key" type="button" onClick={() => handleInput('Z')}>Z</button>
            </span>
            {'XCVBNM'.split('').map(k => (
              <button key={k} type="button" className="wordme-key" onClick={() => handleInput(k)}>{k}</button>
            ))}
            <button className="wordme-key wide wordme-key--enter" type="button" disabled={submitting} onClick={handleEnter}>ENTER</button>
          </div>
        </div>
      </div>
    </div>
  );
}
