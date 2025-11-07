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
    const { name, email, cpf, phone, password, confirmPassword } = req.body;

    if (!name || !email || !cpf || !phone || !password || !confirmPassword) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'As senhas não coincidem.' });
    }
    const emailNorm = String(email).toLowerCase().trim();
    const cpfNorm = normalizeDigits(cpf);
    const phoneNorm = normalizeDigits(phone);

    // Basic server-side format validations
    if (cpfNorm.length !== 11) {
      return res.status(400).json({ error: 'CPF inválido. Use o formato 000.000.000-00.' });
    }
    if (phoneNorm.length !== 11) {
      return res.status(400).json({ error: 'Telefone inválido. Use o formato (00) 0 0000-0000.' });
    }

    // CPF checksum validation (server-side safeguard)
    const isInvalidSequence = /^(\d)\1{10}$/.test(cpfNorm);
    if (!isInvalidSequence) {
      let sum = 0;
      for (let i = 0; i < 9; i++) sum += parseInt(cpfNorm[i], 10) * (10 - i);
      let first = (sum * 10) % 11; if (first === 10) first = 0;
      if (first !== parseInt(cpfNorm[9], 10)) {
        return res.status(400).json({ error: 'CPF inválido. Use o formato 000.000.000-00.' });
      }
      sum = 0;
      for (let i = 0; i < 10; i++) sum += parseInt(cpfNorm[i], 10) * (11 - i);
      let second = (sum * 10) % 11; if (second === 10) second = 0;
      if (second !== parseInt(cpfNorm[10], 10)) {
        return res.status(400).json({ error: 'CPF inválido. Use o formato 000.000.000-00.' });
      }
    } else {
      return res.status(400).json({ error: 'CPF inválido. Use o formato 000.000.000-00.' });
    }

    const existing = await User.findOne({ $or: [{ email: emailNorm }, { cpf: cpfNorm }, { phone: phoneNorm }] });
    if (existing) {
      const conflict = existing.email === emailNorm ? 'email' : existing.cpf === cpfNorm ? 'cpf' : 'telefone';
      return res.status(409).json({ error: `Já existe um usuário com este ${conflict}.` });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const displayName = String(name).trim();
  const user = await User.create({ name: displayName, email: emailNorm, cpf: cpfNorm, phone: phoneNorm, passwordHash });

  return res.status(201).json({ id: user._id, name: displayName, email: emailNorm, cpf: cpfNorm, phone: phoneNorm, theme: user.theme });
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


    // Use timeout_login from .env, default to 24h
    const timeoutLogin = process.env.timeout_login || '24h';
    // Convert timeoutLogin to ms for session expiration
    function parseTimeout(val) {
      if (typeof val === 'number') return val;
      if (typeof val !== 'string') return 24 * 60 * 60 * 1000;
      if (/^\d+$/.test(val)) return parseInt(val, 10);
      const match = val.match(/^(\d+)([smhd])$/i);
      if (!match) return 24 * 60 * 60 * 1000;
      const num = parseInt(match[1], 10);
      const unit = match[2].toLowerCase();
      switch (unit) {
        case 's': return num * 1000;
        case 'm': return num * 60 * 1000;
        case 'h': return num * 60 * 60 * 1000;
        case 'd': return num * 24 * 60 * 60 * 1000;
        default: return 24 * 60 * 60 * 1000;
      }
    }
    const expiresMs = parseTimeout(timeoutLogin);
    const token = jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: timeoutLogin });

    // three random tokens from server side
    const token_login = (await bcrypt.genSalt(10)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 24);
    const token_account = (await bcrypt.genSalt(10)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 24);
    const token_default = (await bcrypt.genSalt(10)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 24);

    // Session expires according to timeout_login
    const expiresAt = new Date(Date.now() + expiresMs);
    await Session.create({ userId: user._id, token_login, token_account, token_default, expiresAt });

    const displayName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return res.json({
      token,
      tokens: { token_login, token_account, token_default },
      user: { id: user._id, name: displayName, email: user.email, cpf: user.cpf, phone: user.phone, theme: user.theme }
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

// Update theme
router.patch('/theme', authMiddleware, sessionGuard, async (req, res) => {
  try {
    const { theme } = req.body;
    if (!['light', 'dark'].includes(theme)) {
      return res.status(400).json({ error: 'Tema inválido. Use light ou dark.' });
    }
    const user = await User.findByIdAndUpdate(req.userId, { theme }, { new: true }).select('-passwordHash');
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
    return res.json({ id: user._id, theme: user.theme });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno ao atualizar tema.' });
  }
});

export default router;
