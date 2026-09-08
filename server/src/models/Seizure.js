import mongoose from 'mongoose';

const SeizureSchema = new mongoose.Schema({
  seizure_id: { type: String, required: true, unique: true },
  session_id: { type: String, required: true },
  scan_id: { type: String },
  entity_name: { type: String, required: true },
  entity_reg_no: { type: String },
  product_name: { type: String, required: true },
  quantity_seized_units: { type: Number, required: true },
  unit_of_measure: { type: String, default: 'packages' },
  estimated_stock_value: { type: Number, default: 0 },
  reason_for_seizure: { 
    type: String, 
    enum: [
      'Missing Mandatory Declarations (Rule 6)',
      'Substantial Net Quantity Deficiency exceeding MPE (Rule 12)',
      'Defaced / Altered / Over-printed MRP (Rule 6(1)(e))',
      'Unregistered Manufacturer / Packer (Rule 27)',
      'Misleading Non-Standard Packaging (Rule 5)',
      'Counterfeit / Smuggled without Country of Origin (Rule 6(1)(g))'
    ],
    required: true 
  },
  statutory_act_section: { type: String, default: 'Section 15 of Legal Metrology Act, 2009' },
  evidence_photos: [{ type: String }],
  custody_location: { type: String, default: 'District Legal Metrology Vault / Safe Custody' },
  custodian_officer: { type: String, required: true },
  witness_details: { type: String },
  status: { type: String, enum: ['SEIZED_IN_CUSTODY', 'RELEASED_ON_BOND', 'COMPOUNDED_DISPOSED', 'CONFISCATED_COURT'], default: 'SEIZED_IN_CUSTODY' },
  created_at: { type: Date, default: Date.now }
});

export const Seizure = mongoose.model('Seizure', SeizureSchema);
export default Seizure;
