import mongoose from 'mongoose';

// Create (or reuse) a dedicated connection to the 'wordme' database
let wordmeConn = null;
function getWordmeConn() {
  if (wordmeConn) return wordmeConn;
  const mainUri = process.env.MONGO_URI || 'mongodb://root:change_me@mongo:27017/games_hub?authSource=admin';
  const override = process.env.WORDME_MONGO_URI;
  let uri = override;
  if (!uri) {
    try {
      const u = new URL(mainUri);
      u.pathname = '/wordme';
      uri = u.toString();
    } catch {
      uri = 'mongodb://root:change_me@mongo:27017/wordme?authSource=admin';
    }
  }
  wordmeConn = mongoose.createConnection(uri);
  return wordmeConn;
}

const cache = {};

function getWordModel(len) {
  if (![5,6,7].includes(len)) throw new Error('Unsupported word length');
  if (cache[len]) return cache[len];
  const schema = new mongoose.Schema({
    word: { type: String, required: true, unique: true, minlength: len, maxlength: len, lowercase: true, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  }, { timestamps: true });
  schema.index({ word: 1 });
  const conn = getWordmeConn();
  cache[len] = conn.model(`words${len}`, schema, `words${len}`);
  return cache[len];
}

export default getWordModel;