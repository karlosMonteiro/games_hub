import { Router } from 'express';
import jwt from 'jsonwebtoken';
import Session from '../models/Session.js';
import User from '../models/User.js';
import getWordModel from '../models/Word.js';

const router = Router();

// Simple ping to verify route availability
router.get('/ping', (req, res) => res.json({ ok: true, service: 'wordme' }));

function auth(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    req.userId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

async function session(req, res, next) {
  try {
    const { token_login, token_account, token_default } = req.headers;
    if (!token_login || !token_account || !token_default) return res.status(401).json({ error: 'Missing session tokens' });
    const s = await Session.findOne({ userId: req.userId, token_login, token_account, token_default, expiresAt: { $gt: new Date() } });
    if (!s) return res.status(401).json({ error: 'Invalid session' });
    next();
  } catch {
    return res.status(500).json({ error: 'Erro de sessão' });
  }
}

async function requireAdmin(req, res, next) {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
  if (user.role !== 'admin') return res.status(403).json({ error: 'Apenas superadmin' });
  next();
}

function validateWord(raw) {
  if (typeof raw !== 'string') return { ok: false, reason: 'Palavra inválida' };
  const word = raw.trim().toLowerCase();
  // Only a-z letters, no accents, digits, symbols
  if (!/^[a-z]+$/.test(word)) return { ok: false, reason: 'Use apenas letras sem acentos' };
  if (word.length < 5 || word.length > 7) return { ok: false, reason: 'Tamanho deve ser 5 a 7 letras' };
  return { ok: true, word };
}

// Current authenticated user (for game page header)
router.get('/me', auth, session, async (req, res) => {
  try {
    const u = await User.findById(req.userId).select('_id name email role');
    if (!u) return res.status(404).json({ error: 'Usuário não encontrado' });
    return res.json({ user: { id: u._id, name: u.name, email: u.email, role: u.role } });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Erro ao carregar usuário' });
  }
});

// Get a random 5-letter word for the game
router.get('/word', auth, session, async (req, res) => {
  try {
    const Model = getWordModel(5);
    const docs = await Model.aggregate([{ $sample: { size: 1 } }]);
    if (!docs.length) return res.status(404).json({ error: 'Nenhuma palavra encontrada' });
    const w = String(docs[0].word || '').toUpperCase();
    return res.json({ word: w });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Erro ao obter palavra' });
  }
});

// List words with optional length filter and search prefix
router.get('/words', auth, session, requireAdmin, async (req, res) => {
  try {
    const { length, search } = req.query;
    const len = parseInt(length, 10);
    if (![5,6,7].includes(len)) return res.status(400).json({ error: 'Length deve ser 5,6 ou 7' });
    const Model = getWordModel(len);
    const criteria = {};
    if (search) criteria.word = new RegExp('^' + String(search).toLowerCase().replace(/[^a-z]/g, ''), 'i');
    const words = await Model.find(criteria).sort({ word: 1 }).limit(500);
    res.json(words.map(w => ({ id: w._id, word: w.word })));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao listar' });
  }
});

// Create word
router.post('/words', auth, session, requireAdmin, async (req, res) => {
  try {
    const { word } = req.body;
    const v = validateWord(word);
    if (!v.ok) return res.status(400).json({ error: v.reason });
    const Model = getWordModel(v.word.length);
    const exists = await Model.findOne({ word: v.word });
    if (exists) return res.status(409).json({ error: 'Já existe' });
    const created = await Model.create({ word: v.word, createdBy: req.userId });
    res.status(201).json({ id: created._id, word: created.word });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao criar' });
  }
});

// Update word (change text -> may move collection if length changes)
router.patch('/words/:id', auth, session, requireAdmin, async (req, res) => {
  try {
    const { newWord } = req.body;
    const v = validateWord(newWord);
    if (!v.ok) return res.status(400).json({ error: v.reason });
    // Need original length to know collection; try all collections
    let originalDoc = null; let originalLen = null; let originalModel = null;
    for (const len of [5,6,7]) {
      const Model = getWordModel(len);
      const found = await Model.findById(req.params.id);
      if (found) { originalDoc = found; originalLen = len; originalModel = Model; break; }
    }
    if (!originalDoc) return res.status(404).json({ error: 'Não encontrado' });
    const targetLen = v.word.length;
    if (targetLen === originalLen) {
      originalDoc.word = v.word;
      await originalDoc.save();
      return res.json({ id: originalDoc._id, word: originalDoc.word });
    } else {
      // Move to different collection
      const TargetModel = getWordModel(targetLen);
      const exists = await TargetModel.findOne({ word: v.word });
      if (exists) return res.status(409).json({ error: 'Já existe na coleção destino' });
      const created = await TargetModel.create({ word: v.word, createdBy: originalDoc.createdBy });
      await originalModel.findByIdAndDelete(originalDoc._id);
      return res.json({ id: created._id, word: created.word });
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao atualizar' });
  }
});

// Delete word
router.delete('/words/:id', auth, session, requireAdmin, async (req, res) => {
  try {
    for (const len of [5,6,7]) {
      const Model = getWordModel(len);
      const del = await Model.findByIdAndDelete(req.params.id);
      if (del) return res.json({ ok: true });
    }
    return res.status(404).json({ error: 'Não encontrado' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao remover' });
  }
});

export default router;