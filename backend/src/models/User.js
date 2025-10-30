import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
  name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    cpf: { type: String, required: true, unique: true, trim: true },
  phone: { type: String, required: true, unique: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' }
  },
  { timestamps: true }
);

// Unique constraints are declared at field level above; explicit indexes removed to avoid duplicates

const User = mongoose.model('User', UserSchema);
export default User;
