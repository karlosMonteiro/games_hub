import express from 'express';
import axios from 'axios';
import Novidade from '../models/Novidade.js';

const router = express.Router();

// GET /api/novidades - Public endpoint (all users)
router.get('/', async (req, res) => {
  try {
    const novidades = await Novidade.find()
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(novidades);
  } catch (error) {
    console.error('Error fetching novidades:', error);
    res.status(500).json({ error: 'Erro ao buscar novidades' });
  }
});

// POST /api/novidades - Create (superadmin only)
router.post('/', async (req, res) => {
  try {
    // Check if user is superadmin
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const introspectionResponse = await axios.post('http://backend:4000/api/auth/introspect', {
      token
    });

    const userData = introspectionResponse.data;
    if (!userData || !userData.isSuperAdmin) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const { title, content, category, tags } = req.body;

    if (!title || !content || !category) {
      return res.status(400).json({ error: 'Campos obrigatórios: title, content, category' });
    }

    const novidade = new Novidade({
      title,
      content,
      category,
      tags: tags || []
    });

    await novidade.save();
    res.status(201).json(novidade);
  } catch (error) {
    if (error?.name === 'ValidationError') {
      const details = Object.values(error.errors || {}).map((e) => e.message).join('; ');
      return res.status(400).json({ error: details || 'Dados inválidos' });
    }
    console.error('Error creating novidade:', error);
    res.status(500).json({ error: 'Erro ao criar novidade' });
  }
});

// PATCH /api/novidades/:id - Update (superadmin only)
router.patch('/:id', async (req, res) => {
  try {
    // Check if user is superadmin
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const introspectionResponse = await axios.post('http://backend:4000/api/auth/introspect', {
      token
    });

    const userData = introspectionResponse.data;
    if (!userData || !userData.isSuperAdmin) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const { id } = req.params;
    const { title, content, category, tags } = req.body;

    const novidade = await Novidade.findByIdAndUpdate(
      id,
      { title, content, category, tags },
      { new: true, runValidators: true }
    );

    if (!novidade) {
      return res.status(404).json({ error: 'Novidade não encontrada' });
    }

    res.json(novidade);
  } catch (error) {
    if (error?.name === 'ValidationError') {
      const details = Object.values(error.errors || {}).map((e) => e.message).join('; ');
      return res.status(400).json({ error: details || 'Dados inválidos' });
    }
    console.error('Error updating novidade:', error);
    res.status(500).json({ error: 'Erro ao atualizar novidade' });
  }
});

// DELETE /api/novidades/:id - Delete (superadmin only)
router.delete('/:id', async (req, res) => {
  try {
    // Check if user is superadmin
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const introspectionResponse = await axios.post('http://backend:4000/api/auth/introspect', {
      token
    });

    const userData = introspectionResponse.data;
    if (!userData || !userData.isSuperAdmin) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const { id } = req.params;
    const novidade = await Novidade.findByIdAndDelete(id);

    if (!novidade) {
      return res.status(404).json({ error: 'Novidade não encontrada' });
    }

    res.json({ message: 'Novidade deletada com sucesso' });
  } catch (error) {
    console.error('Error deleting novidade:', error);
    res.status(500).json({ error: 'Erro ao deletar novidade' });
  }
});

export default router;
