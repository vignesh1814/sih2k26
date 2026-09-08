import mongoose from 'mongoose';

const BoundingBoxSchema = new mongoose.Schema({
  x_min: Number,
  y_min: Number,
  x_max: Number,
  y_max: Number,
  confidence: Number,
  text: String
}, { _id: false });

const HumanVerificationDecisionSchema = new mongoose.Schema({
  rule_code: { type: String, required: true },
  decision: { type: String, enum: ['CONFIRMED', 'REJECTED', 'NEEDS_REVIEW'], required: true },
  officer_notes: { type: String, default: '' },
  verified_by: { type: String, default: 'Field Inspector' },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const RuleViolationSchema = new mongoose.Schema({
  rule_code: { type: String, required: true },
  declaration: { type: String, required: true },
  reason: { type: String, required: true },
  severity: { type: String, enum: ['CRITICAL', 'WARNING'], default: 'CRITICAL' },
  suggested_correction: String,
  bbox: [Number],
  human_decision: { type: String, enum: ['PENDING', 'CONFIRMED', 'REJECTED', 'NEEDS_REVIEW'], default: 'PENDING' }
}, { _id: false });

const ExtractedDeclarationsSchema = new mongoose.Schema({
  generic_name: String,
  net_quantity: String,
  unit: String,
  mrp: Number,
  mrp_text: String,
  has_inclusive_phrase: Boolean,
  unit_sale_price: Number,
  mfg_date: String,
  expiry_date: String,
  manufacturer: String,
  country_of_origin: String,
  consumer_care: String,
  barcode: String
}, { _id: false });

const ImageQualityAssessmentSchema = new mongoose.Schema({
  is_acceptable: { type: Boolean, default: true },
  blur_score: { type: Number, default: 150.0 },
  glare_percentage: { type: Number, default: 0.0 },
  exposure_status: { type: String, default: 'NORMAL' },
  recommended_action: { type: String, default: 'Proceed with analysis' }
}, { _id: false });

const ScanSchema = new mongoose.Schema({
  scan_id: { type: String, required: true, unique: true, index: true },
  session_id: { type: String, default: null, index: true },
  status: { 
    type: String, 
    enum: ['PASS', 'FAIL', 'NEEDS_REVIEW', 'INSUFFICIENT_EVIDENCE', 'SETTLED'], 
    required: true 
  },
  overall_confidence: { type: Number, default: 0.95 },
  image_quality: ImageQualityAssessmentSchema,
  declarations: ExtractedDeclarationsSchema,
  violations: [RuleViolationSchema],
  verification_decisions: [HumanVerificationDecisionSchema],
  detections: [BoundingBoxSchema],
  evidence_hash: { type: String, required: true },
  image_url: String,
  message: String,
  inspector_notes: { type: String, default: '' },
  is_settled: { type: Boolean, default: false },
  settled_at: { type: Date },
  settlement_challan_id: { type: String },
  is_manufacturer_self_check: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now, index: true }
});

export const Scan = mongoose.model('Scan', ScanSchema);
export default Scan;
