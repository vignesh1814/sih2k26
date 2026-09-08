import mongoose from 'mongoose';

const InspectionSessionSchema = new mongoose.Schema({
  session_id: { type: String, required: true, unique: true },
  inspector_id: { type: String, required: true },
  inspector_name: { type: String, required: true },
  jurisdiction_district: { type: String, required: true },
  jurisdiction_state: { type: String, required: true },
  inspection_type: { 
    type: String, 
    enum: ['Routine inspection', 'Surprise inspection', 'Complaint-based inspection', 'Follow-up inspection', 'Registration-related inspection'],
    default: 'Routine inspection'
  },
  gps_location: {
    latitude: { type: Number },
    longitude: { type: Number },
    accuracy_meters: { type: Number },
    address_resolved: { type: String }
  },
  entity_id: { type: String },
  entity_name: { type: String },
  entity_reg_no: { type: String },
  entity_type: { type: String },
  premises_address: { type: String },
  packages_inspected: { type: Number, default: 0 },
  compliant_count: { type: Number, default: 0 },
  review_required_count: { type: Number, default: 0 },
  non_compliant_count: { type: Number, default: 0 },
  violations_detected: { type: Number, default: 0 },
  physical_measurements_recorded: { type: Number, default: 0 },
  seizures_count: { type: Number, default: 0 },
  status: { type: String, enum: ['IN_PROGRESS', 'COMPLETED', 'SUBMITTED_TO_SUPERVISOR', 'APPROVED', 'RETURNED'], default: 'IN_PROGRESS' },
  officer_observations: { type: String },
  action_recommended: { type: String, enum: ['NONE', 'WARNING_NOTICE', 'STATUTORY_CHALLAN', 'SEIZURE_OF_GOODS', 'PROSECUTION'], default: 'NONE' },
  started_at: { type: Date, default: Date.now },
  completed_at: { type: Date }
});

export const InspectionSession = mongoose.model('InspectionSession', InspectionSessionSchema);
export default InspectionSession;
