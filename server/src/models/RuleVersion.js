import mongoose from 'mongoose';

const RuleVersionSchema = new mongoose.Schema({
  rule_id: { type: String, required: true, unique: true },
  rule_code: { type: String, required: true },
  rule_name: { type: String, required: true },
  act_reference: { type: String, required: true },
  section_or_rule: { type: String, required: true },
  amendment_version: { type: String, required: true },
  effective_date: { type: String, required: true },
  commodity_category: { type: String, default: "All Packaged Commodities" },
  requirement_description: { type: String, required: true },
  mandatory: { type: Boolean, default: true },
  applicable_conditions: [{ type: String }],
  penalty_clause: { type: String, default: "Section 36(1) - Up to Rs. 25,000 for first offence" },
  status: { type: String, enum: ['ACTIVE', 'SUPERSEDED', 'DRAFT'], default: 'ACTIVE' },
  created_at: { type: Date, default: Date.now }
});

export const RuleVersion = mongoose.model('RuleVersion', RuleVersionSchema);
export default RuleVersion;
