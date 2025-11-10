import express from 'express';
import mongoose from 'mongoose';
import Word5 from '../models/Word5.js';
import PalavraAceita from '../models/PalavraAceita.js';

const router = express.Router();

// In-memory game sessions (simple; could move to Redis later)
const sessions = new Map(); // key: sessionId, value: { target, guesses: [], status }

function normalizeWord(w) {
  return (w || '').trim().toUpperCase();
}

function evaluateGuess(guess, target) {
  // Returns array of letter states: correct, present, absent
  const res = [];
  const targetArr = target.split('');
  const used = Array(targetArr.length).fill(false);
  const gArr = guess.split('');
  // First pass: correct positions
  gArr.forEach((ch, i) => {
    if (targetArr[i] === ch) {
      res[i] = { letter: ch, state: 'correct' };
      used[i] = true;
    }
  });
  // Second pass: present letters
  gArr.forEach((ch, i) => {
    if (res[i]) return;
    const idx = targetArr.findIndex((t, ti) => t === ch && !used[ti]);
    if (idx >= 0) {
      res[i] = { letter: ch, state: 'present' };
      used[idx] = true;
    } else {
      res[i] = { letter: ch, state: 'absent' };
    }
  });
  return res;
}

function createSessionId() {
  return Math.random().toString(36).slice(2, 10);
}

// POST /api/wordme/game -> start new game
router.post('/game', async (req, res) => {
  try {
    const doc = await Word5.aggregate([{ $sample: { size: 1 } }]);
    if (!doc.length) return res.status(500).json({ error: 'Seed ausente: words5' });
    const target = doc[0].word.toUpperCase();
    const id = createSessionId();
    sessions.set(id, { target, guesses: [], status: 'in_progress' });
    return res.json({ gameId: id, rows: 6, cols: 5 });
  } catch (e) {
    console.error('Erro start game:', e);
    return res.status(500).json({ error: 'Falha ao iniciar jogo' });
  }
});

// POST /api/wordme/guess { gameId, word }
router.post('/guess', async (req, res) => {
  try {
    const { gameId, word } = req.body || {};
    if (!gameId || !word) return res.status(400).json({ error: 'gameId e word necessários' });
    const session = sessions.get(gameId);
    if (!session) return res.status(404).json({ error: 'Jogo não encontrado' });
    if (session.status !== 'in_progress') return res.status(400).json({ error: 'Jogo já finalizado' });
    const guess = normalizeWord(word);
    if (guess.length !== 5) return res.status(400).json({ error: 'A palavra deve ter 5 letras' });

    // Valida se a palavra existe na collection palavras_aceitas
    const aceita = await PalavraAceita.exists({ palavra: guess });
    console.log(`[Wordme] Palavra "${guess}" ${aceita ? 'ACEITA' : 'REJEITADA'}`);
    
    if (!aceita) {
      return res.status(422).json({ error: 'essa palavra não é aceita' });
    }

    const evaluation = evaluateGuess(guess, session.target);
    session.guesses.push({ guess, evaluation });

    let win = guess === session.target;
    if (win) session.status = 'won';
    else if (session.guesses.length >= 6) session.status = 'lost';

    return res.json({
      gameId,
      guess,
      evaluation,
      status: session.status,
      remaining: Math.max(0, 6 - session.guesses.length),
      win,
    });
  } catch (e) {
    console.error('Erro no guess:', e);
    return res.status(500).json({ error: 'Falha ao processar tentativa' });
  }
});

// GET /api/wordme/state/:gameId -> current state (without revealing target)
router.get('/state/:gameId', (req, res) => {
  const { gameId } = req.params;
  const session = sessions.get(gameId);
  if (!session) return res.status(404).json({ error: 'Jogo não encontrado' });
  return res.json({
    gameId,
    status: session.status,
    guesses: session.guesses,
    rows: 6,
    cols: 5,
  });
});

export default router;
