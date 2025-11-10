import mongoose from 'mongoose';

const PalavraAceitaSchema = new mongoose.Schema({
  palavra: { type: String, required: true, unique: true, minlength: 5, maxlength: 5 }, // UPPERCASE A-Z
}, { collection: 'palavras_aceitas' });

export default mongoose.model('PalavraAceita', PalavraAceitaSchema);
