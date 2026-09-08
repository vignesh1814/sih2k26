import mongoose from 'mongoose';

const MeasurementSchema = new mongoose.Schema({
  measurement_id: { type: String, required: true, unique: true, index: true },
  session_id: { type: String, default: null, index: true },
  scan_id: { type: String, default: null },
  sample_no: { type: String, default: 'SMPL-01' },
  product_name: { type: String, required: true },
  declared_quantity: { type: Number, required: true },
  declared_unit: { type: String, required: true, default: 'g' },
  measured_quantity: { type: Number, required: true },
  mpe_limit: { type: Number, required: true },
  deviation: { type: Number, required: true },
  deviation_percentage: { type: Number, default: 0 },
  is_compliant: { type: Boolean, required: true },
  instrument_type: { type: String, default: 'Class II Digital Electronic Balance' },
  instrument_certificate_no: { type: String, default: 'VER-2026-NABL-0988' },
  officer_name: { type: String, default: 'Field Inspector' },
  created_at: { type: Date, default: Date.now, index: true }
});

export const Measurement = mongoose.model('Measurement', MeasurementSchema);
export default Measurement;
