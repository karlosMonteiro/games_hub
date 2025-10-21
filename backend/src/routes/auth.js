import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Session from '../models/Session.js';

const router = Router();

function normalizeDigits(s) {
  return (s || '').replace(/\D+/g, '');
}

// Middleware to verify JWT
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

async function sessionGuard(req, res, next) {
  try {
    const { token_login, token_account, token_default } = req.headers;
    if (!token_login || !token_account || !token_default) {
      return res.status(401).json({ error: 'Missing session tokens' });
    }
    const session = await Session.findOne({
      userId: req.userId,
      token_login,
      token_account,
      token_default,
      expiresAt: { $gt: new Date() }
    });
    if (!session) return res.status(401).json({ error: 'Invalid session' });
    req.sessionId = session._id;
    next();
  } catch (e) {
    return res.status(500).json({ error: 'Erro de sessão' });
  }
}

// Register
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, cpf, phone, password, confirmPassword } = req.body;

    if (!firstName || !lastName || !email || !cpf || !phone || !password || !confirmPassword) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'As senhas não coincidem.' });
    }
    const emailNorm = String(email).toLowerCase().trim();
    const cpfNorm = normalizeDigits(cpf);
    const phoneNorm = normalizeDigits(phone);

    const existing = await User.findOne({ $or: [{ email: emailNorm }, { cpf: cpfNorm }, { phone: phoneNorm }] });
    if (existing) {
      const conflict = existing.email === emailNorm ? 'email' : existing.cpf === cpfNorm ? 'cpf' : 'telefone';
      return res.status(409).json({ error: `Já existe um usuário com este ${conflict}.` });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ firstName, lastName, email: emailNorm, cpf: cpfNorm, phone: phoneNorm, passwordHash });

    return res.status(201).json({ id: user._id, firstName, lastName, email: emailNorm, cpf: cpfNorm, phone: phoneNorm });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// Login by email or cpf or phone
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier can be email/cpf/phone
    if (!identifier || !password) return res.status(400).json({ error: 'Informe identificador e senha.' });

    const id = String(identifier).trim();
    const emailCandidate = id.includes('@') ? id.toLowerCase() : null;
    const digits = normalizeDigits(id);

    const user = await User.findOne({
      $or: [
        ...(emailCandidate ? [{ email: emailCandidate }] : []),
        { cpf: digits },
        { phone: digits }
      ]
    });
    if (!user) return res.status(401).json({ error: 'Credenciais inválidas.' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Credenciais inválidas.' });

    const token = jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '24h' });

    // three random tokens from server side
    const token_login = (await bcrypt.genSalt(10)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 24);
    const token_account = (await bcrypt.genSalt(10)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 24);
    const token_default = (await bcrypt.genSalt(10)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 24);

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await Session.create({ userId: user._id, token_login, token_account, token_default, expiresAt });

    return res.json({
      token,
      tokens: { token_login, token_account, token_default },
      user: { id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, cpf: user.cpf, phone: user.phone }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// Me
router.get('/me', authMiddleware, sessionGuard, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-passwordHash');
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
    return res.json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

router.post('/logout', authMiddleware, sessionGuard, async (req, res) => {
  try {
    await Session.findByIdAndDelete(req.sessionId);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao encerrar sessão' });
  }
});

export default router;
