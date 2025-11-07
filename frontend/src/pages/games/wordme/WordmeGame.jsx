import { useEffect, useState } from 'react';
import api from '../../../api';
import './styles/WordmeGame.scss';

export default function WordmeGame() {
  const [me, setMe] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  // Visual only: no game logic for now

  // Visual only: no game logic for now
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
          {[...Array(6)].map((_, rowIdx) => (
            <div className="wordme-blocks-row" key={rowIdx}>
              {[...Array(5)].map((_, colIdx) => (
                <div className="wordme-block" key={colIdx}></div>
              ))}
            </div>
          ))}
        </div>

        <div className="wordme-keyboard">
          {/* Row 1 */}
          <div className="wordme-keyboard-row">
            {"QWERTYUIOP".split('').map((key) => (
              <button className="wordme-key" key={key} type="button">{key}</button>
            ))}
          </div>
          {/* Row 2 with BACKSPACE at end */}
          <div className="wordme-keyboard-row">
            {"ASDFGHJKL".split('').map((key) => (
              <button className="wordme-key" key={key} type="button">{key}</button>
            ))}
            <button className="wordme-key wordme-key--backspace" type="button">⌫</button>
          </div>
          {/* Row 3 with ENTER at end, offset left, Z aligned in height and slightly to the right of A */}
          <div className="wordme-keyboard-row wordme-keyboard-row--offset3">
            <span style={{ marginLeft: '18px' }}>
              <button className="wordme-key" type="button">Z</button>
            </span>
            {"XCVBNM".split('').map((key) => (
              <button className="wordme-key" key={key} type="button">{key}</button>
            ))}
            <button className="wordme-key wide wordme-key--enter" type="button">ENTER</button>
          </div>
        </div>
      </div>
    </div>
  );
}
