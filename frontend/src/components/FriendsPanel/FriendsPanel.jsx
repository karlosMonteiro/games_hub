import { useState, useEffect } from 'react';
import api from '../../api';
import './FriendsPanel.scss';

export default function FriendsPanel({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('friends'); // friends | requests | search
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadFriends();
      loadRequests();
    }
  }, [isOpen]);

  const loadFriends = async () => {
    try {
      const { data } = await api.get('/friends/list');
      setFriends(data.friends || []);
    } catch (error) {
      console.error('Erro ao carregar amigos:', error);
    }
  };

  const loadRequests = async () => {
    try {
      const { data } = await api.get('/friends/requests');
      setRequests(data.requests || []);
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchEmail.trim()) {
      setMessage('Digite um email, ID ou nome para buscar');
      return;
    }

    setLoading(true);
    setMessage('');
    setSearchResult(null);

    try {
      // Tenta usar como query genérica para buscar por email ou nome
      const { data } = await api.get(`/friends/search?query=${encodeURIComponent(searchEmail)}`);
      setSearchResult(data);
      setMessage('');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Erro ao buscar usuário');
      setSearchResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (userId) => {
    setLoading(true);
    setMessage('');

    try {
      await api.post('/friends/request', { targetUserId: userId });
      setMessage('Solicitação enviada com sucesso!');
      setSearchResult({ ...searchResult, hasPendingRequest: true });
    } catch (error) {
      setMessage(error.response?.data?.message || 'Erro ao enviar solicitação');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requesterId) => {
    setLoading(true);
    try {
      await api.post('/friends/accept', { requesterId });
      setMessage('Solicitação aceita!');
      await loadRequests();
      await loadFriends();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Erro ao aceitar solicitação');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRequest = async (requesterId) => {
    setLoading(true);
    try {
      await api.post('/friends/reject', { requesterId });
      setMessage('Solicitação rejeitada');
      await loadRequests();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Erro ao rejeitar solicitação');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFriend = async (friendId) => {
    if (!confirm('Deseja realmente remover este amigo?')) return;

    setLoading(true);
    try {
      await api.delete(`/friends/remove/${friendId}`);
      setMessage('Amigo removido');
      await loadFriends();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Erro ao remover amigo');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="friends-panel-overlay" onClick={onClose}></div>
      <div className="friends-panel">
        <div className="friends-panel-header">
          <h3>Amigos</h3>
          <button className="close-btn" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <div className="friends-panel-tabs">
          <button
            className={`tab-btn ${activeTab === 'friends' ? 'active' : ''}`}
            onClick={() => setActiveTab('friends')}
          >
            <i className="bi bi-people-fill"></i>
            Amigos ({friends.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            <i className="bi bi-person-plus-fill"></i>
            Solicitações ({requests.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
          >
            <i className="bi bi-search"></i>
            Buscar
          </button>
        </div>

        {message && (
          <div className={`friends-message ${message.includes('Erro') || message.includes('não') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        <div className="friends-panel-content">
          {activeTab === 'friends' && (
            <div className="friends-list">
              {friends.length === 0 ? (
                <div className="empty-state">
                  <i className="bi bi-people"></i>
                  <p>Você ainda não tem amigos</p>
                  <small>Use a busca para adicionar amigos pelo email</small>
                </div>
              ) : (
                friends.map((friend) => (
                  <div key={friend._id} className="friend-item">
                    <div className="friend-info">
                      <div className="friend-avatar">
                        <i className="bi bi-person-circle"></i>
                      </div>
                      <div>
                        <div className="friend-name">{friend.name}</div>
                        <div className="friend-email">{friend.email}</div>
                      </div>
                    </div>
                    <button
                      className="btn-remove"
                      onClick={() => handleRemoveFriend(friend._id)}
                      disabled={loading}
                      title="Remover amigo"
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="requests-list">
              {requests.length === 0 ? (
                <div className="empty-state">
                  <i className="bi bi-inbox"></i>
                  <p>Nenhuma solicitação pendente</p>
                </div>
              ) : (
                requests.map((request) => (
                  <div key={request.from._id} className="request-item">
                    <div className="friend-info">
                      <div className="friend-avatar">
                        <i className="bi bi-person-circle"></i>
                      </div>
                      <div>
                        <div className="friend-name">{request.from.name}</div>
                        <div className="friend-email">{request.from.email}</div>
                      </div>
                    </div>
                    <div className="request-actions">
                      <button
                        className="btn-accept"
                        onClick={() => handleAcceptRequest(request.from._id)}
                        disabled={loading}
                      >
                        <i className="bi bi-check-lg"></i>
                      </button>
                      <button
                        className="btn-reject"
                        onClick={() => handleRejectRequest(request.from._id)}
                        disabled={loading}
                      >
                        <i className="bi bi-x-lg"></i>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'search' && (
            <div className="search-section">
              <form onSubmit={handleSearch} className="search-form">
                <div className="search-input-group">
                  <input
                    type="text"
                    placeholder="Digite o email, nome ou ID do usuário"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    disabled={loading}
                  />
                  <button type="submit" disabled={loading}>
                    <i className="bi bi-search"></i>
                    {loading ? 'Buscando...' : 'Buscar'}
                  </button>
                </div>
              </form>

              {searchResult && (
                <div className="search-result">
                  <div className="friend-item">
                    <div className="friend-info">
                      <div className="friend-avatar">
                        <i className="bi bi-person-circle"></i>
                      </div>
                      <div>
                        <div className="friend-name">{searchResult.user.name}</div>
                        <div className="friend-email">{searchResult.user.email}</div>
                      </div>
                    </div>
                    {searchResult.hasPendingRequest ? (
                      <button className="btn-pending" disabled>
                        <i className="bi bi-clock"></i>
                        Pendente
                      </button>
                    ) : (
                      <button
                        className="btn-add"
                        onClick={() => handleSendRequest(searchResult.user._id)}
                        disabled={loading}
                      >
                        <i className="bi bi-person-plus"></i>
                        Adicionar
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
