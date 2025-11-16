import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import wordmeRoutes from './routes/wordme.js';
import novidadesRoutes from './routes/novidades.js';
import friendsRoutes from './routes/friends.js';

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || '*', credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/wordme', wordmeRoutes);
app.use('/api/novidades', novidadesRoutes);
app.use('/api/friends', friendsRoutes);

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://root:change_me@mongo:27017/games_hub?authSource=admin';

async function start() {
  const maxRetries = 20;
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      await mongoose.connect(MONGO_URI);
      console.log('MongoDB connected');
      app.listen(PORT, () => console.log(`API listening on :${PORT}`));
      return;
    } catch (err) {
      attempt++;
      console.error(`MongoDB connection error (attempt ${attempt}/${maxRetries}):`, err.message);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  console.error('Could not connect to MongoDB after retries. Exiting.');
  process.exit(1);
}

start();
