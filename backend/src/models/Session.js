import mongoose from 'mongoose';

const SessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    token_login: { type: String, required: true, index: true },
    token_account: { type: String, required: true, index: true },
    token_default: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

// TTL index: documents expire at expiresAt
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
SessionSchema.index({ userId: 1, token_login: 1, token_account: 1, token_default: 1 }, { unique: true });

const Session = mongoose.model('Session', SessionSchema);
export default Session;
