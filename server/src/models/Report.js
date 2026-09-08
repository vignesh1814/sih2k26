import mongoose from 'mongoose';

const ReportSchema = new mongoose.Schema({
  report_id: { type: String, required: true, unique: true, index: true },
  scan_id: { type: String, required: true },
  officer_name: { type: String, default: 'Enforcement Officer' },
  station_jurisdiction: { type: String, default: 'Legal Metrology Central Enforcement Wing' },
  pdf_url: { type: String, required: true },
  evidence_hash: { type: String, required: true },
  status: { type: String, default: 'COMPLETED' },
  generated_at: { type: Date, default: Date.now },
  notes: String
});

export const Report = mongoose.model('Report', ReportSchema);
