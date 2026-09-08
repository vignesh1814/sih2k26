import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['ADMIN', 'INSPECTOR', 'ANALYST', 'VIEWER'], 
    default: 'INSPECTOR' 
  },
  department: { type: String, default: 'Legal Metrology Directorate' },
  jurisdiction: { type: String, default: 'National' },
  password: { type: String, default: 'password123' },
  created_at: { type: Date, default: Date.now }
});

export const User = mongoose.model('User', UserSchema);
