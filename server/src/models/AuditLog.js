import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now, index: true },
  user_name: { type: String, default: 'Officer System' },
  user_role: { type: String, default: 'INSPECTOR' },
  action: { type: String, required: true },
  resource: { type: String, required: true },
  details: { type: String, required: true },
  status: { type: String, default: 'SUCCESS' },
  ip_address: { type: String, default: '127.0.0.1' }
});

export const AuditLog = mongoose.model('AuditLog', AuditLogSchema);
