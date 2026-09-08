import mongoose from 'mongoose';

const BoundingBoxSchema = new mongoose.Schema({
  x_min: Number,
  y_min: Number,
  x_max: Number,
  y_max: Number,
  confidence: Number,
  text: String
}, { _id: false });

const RuleViolationSchema = new mongoose.Schema({
  rule_code: { type: String, required: true },
  declaration: { type: String, required: true },
  reason: { type: String, required: true },
  severity: { type: String, enum: ['CRITICAL', 'WARNING'], default: 'CRITICAL' },
  suggested_correction: String,
  bbox: [Number]
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
  status: { 
    type: String, 
    enum: ['PASS', 'FAIL', 'NEEDS_REVIEW', 'INSUFFICIENT_EVIDENCE'], 
    required: true 
  },
  overall_confidence: { type: Number, default: 0.95 },
  image_quality: ImageQualityAssessmentSchema,
  declarations: ExtractedDeclarationsSchema,
  violations: [RuleViolationSchema],
  detections: [BoundingBoxSchema],
  evidence_hash: { type: String, required: true },
  image_url: String,
  message: String,
  created_at: { type: Date, default: Date.now, index: true }
});

export const Scan = mongoose.model('Scan', ScanSchema);
