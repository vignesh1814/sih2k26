import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['INSPECTOR', 'DLMO', 'SUPERIOR', 'MANUFACTURER', 'ADMIN', 'ANALYST', 'VIEWER'], 
    default: 'INSPECTOR' 
  },
  department: { type: String, default: 'Legal Metrology Directorate' },
  organization: { type: String, default: '' },
  jurisdiction: { type: String, default: 'District Enforcement Unit' },
  password: { type: String, default: 'password123' },
  created_at: { type: Date, default: Date.now }
});

export const User = mongoose.model('User', UserSchema);
export default User;
