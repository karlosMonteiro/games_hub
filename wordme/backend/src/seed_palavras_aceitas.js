import mongoose from 'mongoose';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const WORDME_MONGO_URI = process.env.WORDME_MONGO_URI || 'mongodb://root:change_me@mongo:27017/wordme?authSource=admin';

const PalavraAceitaSchema = new mongoose.Schema({
  palavra: { type: String, required: true, unique: true },
}, { collection: 'palavras_aceitas' });
const PalavraAceita = mongoose.model('PalavraAceita', PalavraAceitaSchema);

function normalizeAZ(str) {
  return (str || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}+/gu, '')
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase();
}

function generatePrefixes() {
  // Gera todos prefixos de 3 letras (26^3 = 17576)
  const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
  const list = [];
  for (const a of letters) {
    for (const b of letters) {
      for (const c of letters) {
        list.push(a + b + c);
      }
    }
  }
  // Embaralha para distribuir carga
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchFromDicionarioAberto(maxWords) {
  const base = 'https://api.dicionario-aberto.net/prefix/';
  const prefixes = generatePrefixes();
  const palavrasSet = new Set();
  let prefixesChecked = 0;
  
  console.log(`Buscando até ${maxWords} palavras de 5 letras...`);
  
  for (const prefix of prefixes) {
    if (palavrasSet.size >= maxWords) break;
    
    try {
      const { data } = await axios.get(base + encodeURIComponent(prefix), { timeout: 10000 });
      
      if (Array.isArray(data)) {
        for (const item of data) {
          const word = typeof item === 'string' ? item : item?.word;
          if (!word) continue;
          
          const normalized = normalizeAZ(word);
          if (normalized.length === 5 && !palavrasSet.has(normalized)) {
            palavrasSet.add(normalized);
            if (palavrasSet.size >= maxWords) break;
          }
        }
      }
      
      prefixesChecked++;
      if (prefixesChecked % 100 === 0) {
        console.log(`Progresso: ${prefixesChecked} prefixos verificados, ${palavrasSet.size} palavras coletadas`);
      }
      
      // Delay gentil para não sobrecarregar API pública
      await delay(100);
      
    } catch (e) {
      // Silencia erros individuais de prefixo
    }
  }
  
  console.log(`Coleta finalizada: ${palavrasSet.size} palavras únicas de 5 letras`);
  return Array.from(palavrasSet);
}

async function main() {
  await mongoose.connect(WORDME_MONGO_URI);
  await PalavraAceita.ensureIndexes();
  
  // Verifica quantas já existem
  const existing = await PalavraAceita.countDocuments();
  console.log(`Collection 'palavras_aceitas' possui ${existing} palavras.`);
  
  const targetTotal = parseInt(process.argv[2] || process.env.TARGET_WORDS || '5000', 10);
  const toFetch = Math.max(0, targetTotal - existing);
  
  if (toFetch === 0) {
    console.log(`Meta de ${targetTotal} palavras já atingida. Nada a fazer.`);
    await mongoose.disconnect();
    return;
  }
  
  console.log(`Buscando ${toFetch} novas palavras para atingir meta de ${targetTotal}...`);
  
  const palavras = await fetchFromDicionarioAberto(toFetch);
  
  let inserted = 0;
  for (const palavra of palavras) {
    try {
      await PalavraAceita.updateOne(
        { palavra },
        { $setOnInsert: { palavra } },
        { upsert: true }
      );
      inserted++;
      
      if (inserted % 500 === 0) {
        console.log(`Inseridas ${inserted}/${palavras.length} palavras...`);
      }
    } catch (e) {
      // Ignora duplicatas
    }
  }
  
  const total = await PalavraAceita.countDocuments();
  console.log(`\n✅ Seed concluído!`);
  console.log(`   Novas inseridas: ${inserted}`);
  console.log(`   Total na collection: ${total}`);
  
  await mongoose.disconnect();
}

main().catch(e => {
  console.error('❌ Erro no seed:', e);
  process.exit(1);
});
