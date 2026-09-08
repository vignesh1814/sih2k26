import mongoose from 'mongoose';

const ChallanSchema = new mongoose.Schema({
  challan_id: { type: String, required: true, unique: true, index: true },
  scan_id: { type: String, default: null },
  manufacturer_name: { type: String, required: true, index: true },
  product_name: { type: String, required: true },
  issued_by: { type: String, default: 'District Legal Metrology Officer' },
  issued_by_role: { type: String, default: 'DLMO' },
  inspector_name: { type: String, default: 'Field Inspector' },
  violation_codes: [{ type: String }],
  act_sections: [{ type: String }],
  penalty_amount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['ISSUED', 'ACKNOWLEDGED', 'RECTIFIED', 'PAID', 'HEARING_SCHEDULED', 'DISMISSED'], 
    default: 'ISSUED',
    index: true 
  },
  due_date: { type: Date, required: true },
  hearing_date: { type: Date },
  issued_at: { type: Date, default: Date.now, index: true },
  manufacturer_response: { type: String, default: null },
  rectification_proof_url: { type: String, default: null },
  payment_mode: { type: String, default: null },
  transaction_id: { type: String, default: null },
  paid_at: { type: Date, default: null },
  notes: { type: String, default: '' }
});

export const Challan = mongoose.model('Challan', ChallanSchema);
export default Challan;
