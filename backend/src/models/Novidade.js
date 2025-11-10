import mongoose from 'mongoose';

const novidadeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    // Align with frontend options
    enum: ['Geral', 'Jogos', 'Atualização', 'Evento', 'Manutenção']
  },
  tags: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

export default mongoose.model('Novidade', novidadeSchema);
