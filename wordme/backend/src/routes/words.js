import express from 'express';
import PalavraAceita from '../models/PalavraAceita.js';

const router = express.Router();

function normalizePalavra(str) {
  return (str || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}+/gu, '')
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase();
}

// GET /api/wordme/words/stats - counts by length
router.get('/stats', async (req, res) => {
  try {
    const [count5, count6, count7] = await Promise.all([
      PalavraAceita.countDocuments({ palavra: { $regex: '^.{5}$' } }),
      PalavraAceita.countDocuments({ palavra: { $regex: '^.{6}$' } }),
      PalavraAceita.countDocuments({ palavra: { $regex: '^.{7}$' } })
    ]);
    
    return res.json({
      words5: count5,
      words6: count6,
      words7: count7,
      total: count5 + count6 + count7
    });
  } catch (e) {
    console.error('Erro GET /words/stats:', e);
    return res.status(500).json({ error: 'Falha ao buscar estatísticas' });
  }
});

// GET /api/wordme/words?length=5&search=ca&page=1
router.get('/', async (req, res) => {
  try {
    const length = parseInt(req.query.length) || 5;
    const search = (req.query.search || '').trim().toUpperCase();
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const perPage = 20;
    const skip = (page - 1) * perPage;
    
    const filter = { palavra: { $regex: `^.{${length}}$` } };
    if (search) {
      filter.palavra = { $regex: `^${search}`, $options: 'i' };
      filter.$expr = { $eq: [{ $strLenCP: '$palavra' }, length] };
    }
    
    const [docs, total] = await Promise.all([
      PalavraAceita.find(filter).skip(skip).limit(perPage).sort({ palavra: 1 }).lean(),
      PalavraAceita.countDocuments(filter)
    ]);
    
    const list = docs.map(d => ({ id: d._id.toString(), word: d.palavra }));
    const totalPages = Math.ceil(total / perPage);
    
    return res.json({
      list,
      pagination: {
        page,
        perPage,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (e) {
    console.error('Erro GET /words:', e);
    return res.status(500).json({ error: 'Falha ao buscar palavras' });
  }
});

// POST /api/wordme/words { word }
router.post('/', async (req, res) => {
  try {
    const { word } = req.body || {};
    if (!word) return res.status(400).json({ error: 'word é obrigatório' });
    
    const normalized = normalizePalavra(word);
    if (normalized.length < 5 || normalized.length > 7) {
      return res.status(400).json({ error: 'Palavra deve ter entre 5 e 7 letras' });
    }
    
    const existing = await PalavraAceita.findOne({ palavra: normalized });
    if (existing) {
      return res.status(409).json({ error: 'Palavra já existe' });
    }
    
    const doc = await PalavraAceita.create({ palavra: normalized });
    return res.json({ id: doc._id.toString(), word: doc.palavra });
  } catch (e) {
    console.error('Erro POST /words:', e);
    return res.status(500).json({ error: 'Falha ao adicionar palavra' });
  }
});

// PATCH /api/wordme/words/:id { newWord }
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { newWord } = req.body || {};
    if (!newWord) return res.status(400).json({ error: 'newWord é obrigatório' });
    
    const normalized = normalizePalavra(newWord);
    if (normalized.length < 5 || normalized.length > 7) {
      return res.status(400).json({ error: 'Palavra deve ter entre 5 e 7 letras' });
    }
    
    const doc = await PalavraAceita.findByIdAndUpdate(
      id,
      { palavra: normalized },
      { new: true, runValidators: true }
    );
    
    if (!doc) return res.status(404).json({ error: 'Palavra não encontrada' });
    
    return res.json({ id: doc._id.toString(), word: doc.palavra });
  } catch (e) {
    console.error('Erro PATCH /words/:id:', e);
    return res.status(500).json({ error: 'Falha ao atualizar palavra' });
  }
});

// DELETE /api/wordme/words/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await PalavraAceita.findByIdAndDelete(id);
    
    if (!doc) return res.status(404).json({ error: 'Palavra não encontrada' });
    
    return res.json({ ok: true });
  } catch (e) {
    console.error('Erro DELETE /words/:id:', e);
    return res.status(500).json({ error: 'Falha ao remover palavra' });
  }
});

export default router;
