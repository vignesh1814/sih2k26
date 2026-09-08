import mongoose from 'mongoose';

const EntitySchema = new mongoose.Schema({
  entity_id: { type: String, required: true, unique: true },
  registration_no: { type: String, required: true, unique: true }, // e.g., GOI/TS/2026/2779
  firm_name: { type: String, required: true },
  entity_type: { 
    type: String, 
    enum: ['Manufacturer', 'Packer', 'Importer', 'Manufacturer & Packer', 'Wholesaler / Distributor'], 
    required: true 
  },
  establishment_address: { type: String, required: true },
  district: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  registered_commodities: [{ type: String }],
  license_status: { type: String, enum: ['ACTIVE', 'EXPIRED', 'SUSPENDED', 'UNDER_REVIEW'], default: 'ACTIVE' },
  registration_date: { type: String, required: true },
  valid_upto: { type: String, required: true },
  contact_email: { type: String },
  contact_phone: { type: String },
  compliance_rating: { type: Number, default: 92 },
  total_inspections: { type: Number, default: 0 },
  violations_count: { type: Number, default: 0 },
  repeat_offender: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
});

export const Entity = mongoose.model('Entity', EntitySchema);
export default Entity;
