import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import axios from 'axios';
import gameRouter from './routes/game.js';
import wordsRouter from './routes/words.js';

dotenv.config();

const app = express();

// Middlewares
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || '*', credentials: true }));
app.use(express.json());
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// Mongo connection (Wordme isolated DB)
const WORDME_MONGO_URI = process.env.WORDME_MONGO_URI || 'mongodb://root:change_me@mongo:27017/wordme?authSource=admin';
const PORT = process.env.PORT || 4100;
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://backend:4000';

async function connectWithRetry(uri, retries = 20, delayMs = 2000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(uri);
      console.log('MongoDB (wordme) connected');
      return;
    } catch (e) {
      if (attempt === retries) throw e;
      console.log(`Mongo indisponível (tentativa ${attempt}/${retries}). Aguardando...`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

// Auth guard via principal introspection
async function authGuard(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    const tLogin = req.headers['token_login'];
    const tAcc = req.headers['token_account'];
    const tDef = req.headers['token_default'];
    if (!auth || !tLogin || !tAcc || !tDef) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const url = `${AUTH_SERVICE_URL}/api/auth/me`;
    const { data } = await axios.get(url, {
      headers: {
        authorization: auth,
        token_login: tLogin,
        token_account: tAcc,
        token_default: tDef,
      },
      timeout: 3000,
    });
    req.user = data; // user object from principal
    next();
  } catch (e) {
    if (e.response?.status === 401) return res.status(401).json({ error: 'Unauthorized' });
    console.error('Auth introspection failed:', e.message);
    return res.status(500).json({ error: 'Auth service unavailable' });
  }
}

// Routes
app.get('/api/wordme/health', (req, res) => {
  res.json({ status: 'ok', service: 'wordme-backend' });
});

// Game routes (create game, guess, get state)
app.use('/api/wordme', authGuard, gameRouter);

// Words CRUD routes for admin settings
app.use('/api/wordme/words', authGuard, wordsRouter);

app.get('/api/wordme/me', authGuard, (req, res) => {
  res.json({ user: req.user });
});

app.get('/api/wordme/ping', authGuard, (req, res) => {
  res.json({ ok: true, userId: req.user?._id || req.user?.id });
});

async function start() {
  await connectWithRetry(WORDME_MONGO_URI);
  app.listen(PORT, () => console.log(`Wordme API listening on :${PORT}`));
}

start();
