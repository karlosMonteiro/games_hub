import mongoose from 'mongoose';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const WORDME_MONGO_URI = process.env.WORDME_MONGO_URI || 'mongodb://root:change_me@mongo:27017/wordme?authSource=admin';

// Inline model and index
const Word5Schema = new mongoose.Schema({
  word: { type: String, required: true, unique: true }, // UPPERCASE A-Z, length 5
}, { collection: 'words5' });
const Word5 = mongoose.model('Word5', Word5Schema);

function normalizeAZ(str) {
  return (str || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}+/gu, '')
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase();
}

function threeLetterPrefixes() {
  const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
  const list = [];
  for (const a of letters) {
    for (const b of letters) {
      for (const c of letters) list.push(a + b + c);
    }
  }
  // pequena aleatorização para distribuir chamadas
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

async function delay(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function fetchFromDicionarioAberto(desired, existingSet) {
  // Source: Dicionário Aberto (PT). Endpoint: /prefix/{string}
  // Docs: https://api.dicionario-aberto.net/
  // OBS: requer pelo menos 3 letras de prefixo
  const base = 'https://api.dicionario-aberto.net/prefix/';
  const prefixes = threeLetterPrefixes();
  const newSet = new Set();
  const seen = new Set(existingSet); // evita duplicar entre chamadas

  for (const p of prefixes) {
    if (newSet.size >= desired) break;
    try {
      const { data } = await axios.get(base + encodeURIComponent(p), { timeout: 15000 });
      if (Array.isArray(data)) {
        for (const item of data) {
          const w = typeof item === 'string' ? item : item?.word;
          if (!w) continue;
          const norm = normalizeAZ(String(w));
          if (norm.length === 5 && !seen.has(norm)) {
            newSet.add(norm);
            seen.add(norm);
            if (newSet.size >= desired) break;
          }
        }
      } else if (data && data.status === 'error') {
        // silent for known errors like "Search string is too short!"
      }
    } catch (e) {
      console.warn(`Falha ao buscar prefixo '${p}':`, e.message);
    }
    // pequeno intervalo para ser gentil com a API pública
    await delay(120);
  }
  return Array.from(newSet);
}

async function main() {
  await mongoose.connect(WORDME_MONGO_URI);
  await Word5.ensureIndexes();

  const desired = Math.max(1, parseInt(process.argv[2] || process.env.WORDS5_COUNT || '100', 10));
  console.log(`Buscando até ${desired} palavras (5 letras, PT)…`);

  // Carrega palavras já existentes para evitar repetir
  const existingDocs = await Word5.find({}, { word: 1, _id: 0 }).lean();
  const existing = new Set(existingDocs.map((d) => d.word));

  const fetched = await fetchFromDicionarioAberto(desired, existing);
  // Filtra somente novas
  const candidates = fetched.filter((w) => !existing.has(w));

  if (candidates.length === 0) {
    if (existing.size > 0) {
      console.log('Nenhuma palavra nova encontrada na fonte (todas já existem).');
    } else {
      console.log('Não foi possível obter palavras da fonte no momento. Tente novamente mais tarde.');
    }
    await mongoose.disconnect();
    return;
  }

  let inserted = 0;
  // Insere no máximo `desired` novas palavras
  for (let i = 0; i < desired && i < candidates.length; i++) {
    const w = candidates[i];
    try {
      const res = await Word5.updateOne(
        { word: w },
        { $setOnInsert: { word: w } },
        { upsert: true }
      );
      // Conta apenas se foi realmente inserido agora
      if ((res && (res.upsertedId || res.upsertedCount > 0)) || res.matchedCount === 0) {
        inserted++;
      }
    } catch (e) {
      // ignora erros por duplicidade/validação
    }
  }

  const total = await Word5.countDocuments();
  console.log(`Seed concluído. Novos inseridos: ${inserted}. Total na coleção: ${total}.`);

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error('Falha no seed words5:', e);
  process.exit(1);
});
