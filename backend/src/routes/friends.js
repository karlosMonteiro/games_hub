import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

// Middleware para verificar autenticação
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    req.userId = payload.sub;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Buscar usuário por email ou ID
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { email, id, query } = req.query;
    
    if (!email && !id && !query) {
      return res.status(400).json({ message: 'Email, ID ou termo de busca é obrigatório' });
    }

    let user = null;

    // Buscar por ID se fornecido
    if (id) {
      user = await User.findById(id).select('_id name email');
    }
    // Buscar por email exato
    else if (email) {
      user = await User.findOne({ email: email.toLowerCase() }).select('_id name email');
    }
    // Buscar por query (email parcial ou nome)
    else if (query) {
      const searchTerm = query.toLowerCase();
      user = await User.findOne({
        $or: [
          { email: { $regex: searchTerm, $options: 'i' } },
          { name: { $regex: searchTerm, $options: 'i' } }
        ]
      }).select('_id name email');
    }

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Não permitir adicionar a si mesmo
    if (user._id.toString() === req.userId) {
      return res.status(400).json({ message: 'Você não pode adicionar a si mesmo' });
    }

    // Verificar se já são amigos
    const currentUser = await User.findById(req.userId);
    const isAlreadyFriend = (currentUser.friends || []).some(
      friendId => friendId.toString() === user._id.toString()
    );

    if (isAlreadyFriend) {
      return res.status(400).json({ message: 'Vocês já são amigos' });
    }

    // Verificar se já existe solicitação pendente
    const hasPendingRequest = (user.friendRequests || []).some(
      req => req.from.toString() === currentUser._id.toString()
    );

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email
      },
      hasPendingRequest
    });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ message: 'Erro ao buscar usuário' });
  }
});

// Enviar solicitação de amizade
router.post('/request', authMiddleware, async (req, res) => {
  try {
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ message: 'ID do usuário é obrigatório' });
    }

    if (targetUserId === req.userId) {
      return res.status(400).json({ message: 'Você não pode adicionar a si mesmo' });
    }

    const currentUser = await User.findById(req.userId);
    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Verificar se já são amigos
    if ((currentUser.friends || []).includes(targetUserId)) {
      return res.status(400).json({ message: 'Vocês já são amigos' });
    }

    // Verificar se já existe solicitação
    const alreadyRequested = (targetUser.friendRequests || []).some(
      req => req.from.toString() === currentUser._id.toString()
    );

    if (alreadyRequested) {
      return res.status(400).json({ message: 'Solicitação já enviada' });
    }

    // Adicionar solicitação
    if (!targetUser.friendRequests) {
      targetUser.friendRequests = [];
    }
    targetUser.friendRequests.push({
      from: currentUser._id,
      createdAt: new Date()
    });
    await targetUser.save();

    res.json({ message: 'Solicitação de amizade enviada' });
  } catch (error) {
    console.error('Erro ao enviar solicitação:', error);
    res.status(500).json({ message: 'Erro ao enviar solicitação' });
  }
});

// Listar solicitações de amizade recebidas
router.get('/requests', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('friendRequests.from', 'name email');

    res.json({ requests: user.friendRequests || [] });
  } catch (error) {
    console.error('Erro ao listar solicitações:', error);
    res.status(500).json({ message: 'Erro ao listar solicitações' });
  }
});

// Aceitar solicitação de amizade
router.post('/accept', authMiddleware, async (req, res) => {
  try {
    const { requesterId } = req.body;

    if (!requesterId) {
      return res.status(400).json({ message: 'ID do solicitante é obrigatório' });
    }

    const currentUser = await User.findById(req.userId);
    const requester = await User.findById(requesterId);

    if (!requester) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Verificar se existe a solicitação
    const requestIndex = (currentUser.friendRequests || []).findIndex(
      req => req.from.toString() === requesterId
    );

    if (requestIndex === -1) {
      return res.status(404).json({ message: 'Solicitação não encontrada' });
    }

    // Remover solicitação
    if (!currentUser.friendRequests) {
      currentUser.friendRequests = [];
    }
    currentUser.friendRequests.splice(requestIndex, 1);

    // Adicionar como amigos mutuamente
    if (!currentUser.friends) {
      currentUser.friends = [];
    }
    if (!requester.friends) {
      requester.friends = [];
    }
    if (!(currentUser.friends || []).includes(requesterId)) {
      currentUser.friends.push(requesterId);
    }
    if (!(requester.friends || []).includes(req.userId)) {
      requester.friends.push(req.userId);
    }

    await currentUser.save();
    await requester.save();

    res.json({ message: 'Solicitação aceita' });
  } catch (error) {
    console.error('Erro ao aceitar solicitação:', error);
    res.status(500).json({ message: 'Erro ao aceitar solicitação' });
  }
});

// Rejeitar solicitação de amizade
router.post('/reject', authMiddleware, async (req, res) => {
  try {
    const { requesterId } = req.body;

    if (!requesterId) {
      return res.status(400).json({ message: 'ID do solicitante é obrigatório' });
    }

    const currentUser = await User.findById(req.userId);

    const requestIndex = (currentUser.friendRequests || []).findIndex(
      req => req.from.toString() === requesterId
    );

    if (requestIndex === -1) {
      return res.status(404).json({ message: 'Solicitação não encontrada' });
    }

    if (!currentUser.friendRequests) {
      currentUser.friendRequests = [];
    }
    currentUser.friendRequests.splice(requestIndex, 1);
    await currentUser.save();

    res.json({ message: 'Solicitação rejeitada' });
  } catch (error) {
    console.error('Erro ao rejeitar solicitação:', error);
    res.status(500).json({ message: 'Erro ao rejeitar solicitação' });
  }
});

// Listar amigos
router.get('/list', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('friends', 'name email');

    res.json({ friends: user.friends || [] });
  } catch (error) {
    console.error('Erro ao listar amigos:', error);
    res.status(500).json({ message: 'Erro ao listar amigos' });
  }
});

// Remover amigo
router.delete('/remove/:friendId', authMiddleware, async (req, res) => {
  try {
    const { friendId } = req.params;

    const currentUser = await User.findById(req.userId);
    const friend = await User.findById(friendId);

    if (!friend) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Remover mutuamente
    if (!currentUser.friends) {
      currentUser.friends = [];
    }
    if (!friend.friends) {
      friend.friends = [];
    }
    currentUser.friends = currentUser.friends.filter(
      id => id.toString() !== friendId
    );
    friend.friends = friend.friends.filter(
      id => id.toString() !== req.userId
    );

    await currentUser.save();
    await friend.save();

    res.json({ message: 'Amigo removido' });
  } catch (error) {
    console.error('Erro ao remover amigo:', error);
    res.status(500).json({ message: 'Erro ao remover amigo' });
  }
});

export default router;
