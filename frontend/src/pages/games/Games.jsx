import { useNavigate } from 'react-router-dom';
import './style/Games.scss';

export default function Games() {
  const navigate = useNavigate();

  const games = [
    {
      id: 'wordme',
      name: 'Wordme',
      description: 'Adivinhe a palavra de 5 letras em 6 tentativas',
      color: 'linear-gradient(135deg, #7b2ff2 0%, #f357a8 100%)',
      icon: '🔤',
      path: '/wordme/game',
      tagline: 'Desafie seu vocabulário'
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
