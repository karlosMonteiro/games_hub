import mongoose from 'mongoose';

const Word5Schema = new mongoose.Schema({
  word: { type: String, required: true, unique: true, minlength: 5, maxlength: 5 }, // UPPERCASE
}, { collection: 'words5' });

export default mongoose.model('Word5', Word5Schema);
