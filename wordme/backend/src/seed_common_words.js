import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const WORDME_MONGO_URI = process.env.WORDME_MONGO_URI || 'mongodb://root:change_me@mongo:27017/wordme?authSource=admin';

const Word5Schema = new mongoose.Schema({
  word: { type: String, required: true, unique: true },
}, { collection: 'words5' });
const Word5 = mongoose.model('Word5', Word5Schema);

// Common PT-BR 5-letter words
const commonWords = [
  'TEMPO', 'CASAS', 'PORTA', 'TINHA', 'MAIOR', 'FAZER', 'HOMEM', 'DADOS', 'COISA', 'ASSIM',
  'MUNDO', 'GRANDE', 'PARTE', 'FORMA', 'AINDA', 'CASO', 'LUGAR', 'GRUPO', 'ENTRE', 'SOBRE',
  'FALAR', 'PODER', 'MESMO', 'ANTES', 'DEPOIS', 'QUANDO', 'MUITO', 'POUCO', 'TANTO', 'TODOS',
  'NUNCA', 'AGORA', 'TUDO', 'NADA', 'CERTO', 'CLARO', 'PLANO', 'PONTO', 'LINHA', 'CORPO',
  'CAMPO', 'NOITE', 'NORTE', 'OESTE', 'LESTE', 'TERRA', 'GENTE', 'MONTE', 'PRATO', 'CONTA',
  'JUNTO', 'CARNE', 'PERNA', 'BRAÇO', 'CABEÇA', 'OLHOS', 'OUVIR', 'FALAR', 'ANDAR', 'CORRER',
  'PULAR', 'PARAR', 'FICAR', 'SABER', 'DEVER', 'QUERER', 'VIVER', 'MORTE', 'VIDAR', 'GOSTO',
  'CHAVE', 'LIVRO', 'FOLHA', 'PAPEL', 'LETRA', 'VERBO', 'NOMES', 'CANTO', 'BANDA', 'MUSICA',
  'FILHO', 'PAIS', 'AVOS', 'TIOS', 'PRIMOS', 'SOBR', 'NETO', 'NETA', 'IRMAO', 'IRMA',
  'AMIGO', 'AMOR', 'ODIO', 'RAIVA', 'MEDO', 'FELIZ', 'TRISTE', 'CALMA', 'PRESSA', 'FORCA',
  'FRACO', 'FORTE', 'RAPIDO', 'LENTO', 'ALTO', 'BAIXO', 'CIMA', 'BAIXA', 'FUNDO', 'RASO',
  'QUENTE', 'FRIO', 'CALOR', 'GELO', 'AGUA', 'FOGO', 'AR', 'VENTO', 'CHUVA', 'SOL',
  'LUA', 'ESTRELA', 'CÉU', 'MAR', 'RIO', 'LAGO', 'PEDRA', 'AREIA', 'BARRO', 'METAL',
  'OURO', 'PRATA', 'FERRO', 'COBRE', 'BRONZE', 'VIDRO', 'MADEIRA', 'PLÁSTICO', 'TECIDO', 'COURO',
  'COMER', 'BEBER', 'DORMIR', 'ACORDAR', 'BANHO', 'ROUPA', 'SAPATO', 'CHAPEU', 'LUVA', 'MEIA',
  'CALÇA', 'CAMISA', 'SAIA', 'BLUSA', 'JAQUETA', 'CASACO', 'VESTIDO', 'TERNO', 'GRAVATA', 'CINTO',
  'BOLSA', 'MALA', 'CARTEIRA', 'CHAVE', 'CELULAR', 'TELEFONE', 'COMPUTADOR', 'TECLADO', 'MOUSE', 'TELA',
  'JANELA', 'PORTA', 'PAREDE', 'TETO', 'CHAO', 'ESCADA', 'ELEVADOR', 'CORREDOR', 'SALA', 'COZINHA',
  'BANHEIRO', 'QUARTO', 'VARANDA', 'JARDIM', 'QUINTAL', 'GARAGEM', 'PISCINA', 'CAMPO', 'PRAIA', 'MONTANHA'
].map(w => w.normalize('NFD').replace(/\p{Diacritic}+/gu, '').replace(/[^A-Z]/g, '').toUpperCase()).filter(w => w.length === 5);

async function main() {
  await mongoose.connect(WORDME_MONGO_URI);
  await Word5.ensureIndexes();

  let inserted = 0;
  for (const word of commonWords) {
    try {
      await Word5.updateOne({ word }, { $setOnInsert: { word } }, { upsert: true });
      inserted++;
    } catch (e) {
      // ignore duplicates
    }
  }

  const total = await Word5.countDocuments();
  console.log(`Inserted ${inserted} common words. Total: ${total}`);
  await mongoose.disconnect();
}

main().catch(e => {
  console.error('Seed failed:', e);
  process.exit(1);
});
