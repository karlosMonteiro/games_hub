import { useNavigate } from 'react-router-dom';
import './style/Games.scss';

export default function Games() {
  const navigate = useNavigate();

  const games = [
    {
      id: 'wordme',
      name: 'Wordme',
      description: 'Desafie sua mente com palavras de 5 letras. Você tem 6 tentativas para descobrir a palavra secreta!',
      color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      icon: '🔤',
      path: '/wordme/game',
      tagline: 'Desafie seu vocabulário',
      badge: 'Popular'
    }
  ];

  return (
    <div className="games-page">
      <div className="games-header">
        <h2 className="games-title">Jogos Disponíveis</h2>
        <p className="games-subtitle">Escolha um jogo e divirta-se!</p>
      </div>

      <div className="games-grid">
        {games.map((game) => (
          <div 
            key={game.id} 
            className="game-card" 
            onClick={() => navigate(game.path)}
            style={{ '--game-gradient': game.color }}
          >
            <div className="game-card-background"></div>
            <div className="game-card-content">
              {game.badge && <span className="game-badge">{game.badge}</span>}
              <div className="game-icon">{game.icon}</div>
              <h3 className="game-name">{game.name}</h3>
              <p className="game-tagline">{game.tagline}</p>
              <p className="game-description">{game.description}</p>
              <button className="game-play-btn">
                Jogar Agora <i className="bi bi-arrow-right-circle"></i>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
