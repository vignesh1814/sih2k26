import express from 'express';
import InspectionSession from '../models/InspectionSession.js';
import { inMemoryStore, isDbConnected } from '../db.js';

const router = express.Router();

/**
 * Statutory Maximum Permissible Error (MPE) Table
 * As specified under Second Schedule of Legal Metrology (Packaged Commodities) Rules, 2011
 */
export const calculateMPE = (declaredQty, unit) => {
  const normUnit = (unit || 'g').toLowerCase().trim();
  let qtyInBase = parseFloat(declaredQty) || 0;

  // Convert kg/l to g/ml for uniform range evaluation
  if (normUnit === 'kg' || normUnit === 'l' || normUnit === 'litre' || normUnit === 'liter') {
    qtyInBase = qtyInBase * 1000;
  }

  let permissibleErrorInGrams = 0;
  let ruleCitation = 'Second Schedule (Table 1) - LM (Packaged Commodities) Rules, 2011';

  if (qtyInBase <= 50) {
    permissibleErrorInGrams = qtyInBase * 0.09; // 9%
  } else if (qtyInBase <= 100) {
    permissibleErrorInGrams = 4.5; // 4.5g
  } else if (qtyInBase <= 200) {
    permissibleErrorInGrams = qtyInBase * 0.045; // 4.5%
  } else if (qtyInBase <= 300) {
    permissibleErrorInGrams = 9.0; // 9g
  } else if (qtyInBase <= 500) {
    permissibleErrorInGrams = qtyInBase * 0.03; // 3%
  } else if (qtyInBase <= 1000) {
    permissibleErrorInGrams = 15.0; // 15g
  } else if (qtyInBase <= 10000) {
    permissibleErrorInGrams = qtyInBase * 0.015; // 1.5%
  } else if (qtyInBase <= 15000) {
    permissibleErrorInGrams = 150.0; // 150g
  } else {
    permissibleErrorInGrams = qtyInBase * 0.01; // 1%
  }

  return {
    permissible_limit_grams: Math.round(permissibleErrorInGrams * 100) / 100,
    rule_citation: ruleCitation,
    unit_basis: 'g/ml'
  };
};

// POST /api/inspections/start - Start new inspection session
router.post('/start', async (req, res) => {
  try {
    const {
      inspector_id = 'INSP-LM-2026-001',
      inspector_name = 'Legal Metrology Field Inspector',
      jurisdiction_district = 'Hyderabad',
      jurisdiction_state = 'Telangana',
      inspection_type = 'Routine inspection',
      gps_location = {},
      entity_id,
      entity_name,
      entity_reg_no,
      entity_type,
      premises_address
    } = req.body;

    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const session_id = `IN-${datePart}-${randomSuffix}`;

    const newSession = {
      session_id,
      inspector_id,
      inspector_name,
      jurisdiction_district,
      jurisdiction_state,
      inspection_type,
      gps_location: {
        latitude: gps_location.latitude || 17.3850,
        longitude: gps_location.longitude || 78.4867,
        accuracy_meters: gps_location.accuracy_meters || 5.0,
        address_resolved: gps_location.address_resolved || `${jurisdiction_district}, ${jurisdiction_state}`
      },
      entity_id: entity_id || null,
      entity_name: entity_name || 'Unspecified Establishment',
      entity_reg_no: entity_reg_no || null,
      entity_type: entity_type || 'Manufacturer',
      premises_address: premises_address || '',
      packages_inspected: 0,
      compliant_count: 0,
      review_required_count: 0,
      non_compliant_count: 0,
      violations_detected: 0,
      physical_measurements_recorded: 0,
      seizures_count: 0,
      status: 'IN_PROGRESS',
      action_recommended: 'NONE',
      started_at: new Date()
    };

    if (isDbConnected()) {
      const doc = new InspectionSession(newSession);
      await doc.save();
      return res.status(201).json({ success: true, data: doc });
    }

    inMemoryStore.sessions = inMemoryStore.sessions || [];
    inMemoryStore.sessions.unshift(newSession);
    return res.status(201).json({ success: true, data: newSession });
  } catch (error) {
    console.error('Error starting inspection session:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/inspections - List all inspection sessions
router.get('/', async (req, res) => {
  try {
    const { status, inspector_id, entity_name } = req.query;

    if (isDbConnected()) {
      const filter = {};
      if (status) filter.status = status;
      if (inspector_id) filter.inspector_id = inspector_id;
      if (entity_name) filter.entity_name = { $regex: entity_name, $options: 'i' };

      const sessions = await InspectionSession.find(filter).sort({ started_at: -1 });
      return res.json({ success: true, count: sessions.length, data: sessions });
    }

    let results = inMemoryStore.sessions || [];
    if (status) results = results.filter(s => s.status.toLowerCase() === status.toLowerCase());
    if (inspector_id) results = results.filter(s => s.inspector_id === inspector_id);
    if (entity_name) results = results.filter(s => (s.entity_name || '').toLowerCase().includes(entity_name.toLowerCase()));

    return res.json({ success: true, count: results.length, data: results });
  } catch (error) {
    console.error('Error fetching inspection sessions:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/inspections/:session_id - Get session with attached measurements, scans, and seizures
router.get('/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;

    let session = null;
    if (isDbConnected()) {
      session = await InspectionSession.findOne({ session_id });
    } else {
      session = (inMemoryStore.sessions || []).find(s => s.session_id === session_id);
    }

    if (!session) {
      return res.status(404).json({ success: false, message: 'Inspection session not found' });
    }

    // Attach linked scans, measurements, and seizures
    const measurements = (inMemoryStore.measurements || []).filter(m => m.session_id === session_id);
    const seizures = (inMemoryStore.seizures || []).filter(s => s.session_id === session_id);

    return res.json({
      success: true,
      data: {
        ...session,
        measurements,
        seizures
      }
    });
  } catch (error) {
    console.error('Error fetching session details:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/inspections/measurement - Record physical weight/measure verification
router.post('/measurement', async (req, res) => {
  try {
    const {
      session_id,
      sample_no = `SMPL-${Math.floor(100 + Math.random() * 900)}`,
      product_name = 'Inspected Commodity Package',
      declared_quantity,
      declared_unit = 'g',
      actual_quantity,
      instrument_type = 'Electronic Precision Balance (Class II)',
      instrument_certificate_no = `LM/VER/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`
    } = req.body;

    const declaredVal = parseFloat(declared_quantity) || 0;
    const actualVal = parseFloat(actual_quantity) || 0;
    const diff = actualVal - declaredVal;

    // Evaluate against MPE Schedule
    const mpe = calculateMPE(declaredVal, declared_unit);
    const maxAllowedDeficit = mpe.permissible_limit_grams;

    // Convert diff to grams for comparison if declared in kg/l
    let diffInGrams = diff;
    if (['kg', 'l', 'litre', 'liter'].includes(declared_unit.toLowerCase())) {
      diffInGrams = diff * 1000;
    }

    const isNonCompliant = diffInGrams < 0 && Math.abs(diffInGrams) > maxAllowedDeficit;
    const result = isNonCompliant ? 'FAIL' : 'PASS';

    const reason = isNonCompliant
      ? `Net deficiency of ${Math.abs(diffInGrams).toFixed(1)}g exceeds Maximum Permissible Error (MPE) limit of ${maxAllowedDeficit}g under ${mpe.rule_citation}.`
      : `Net quantity difference of ${diff > 0 ? '+' : ''}${diff}${declared_unit} is within statutory tolerance (MPE limit: ±${maxAllowedDeficit}g).`;

    const measurement = {
      measurement_id: `MSR-${Date.now().toString(36).toUpperCase()}`,
      session_id: session_id || 'GENERAL',
      sample_no,
      product_name,
      declared_quantity: declaredVal,
      declared_unit,
      actual_quantity: actualVal,
      difference: diff,
      permissible_error_limit: maxAllowedDeficit,
      instrument_type,
      instrument_certificate_no,
      result,
      reason,
      created_at: new Date()
    };

    inMemoryStore.measurements = inMemoryStore.measurements || [];
    inMemoryStore.measurements.unshift(measurement);

    // Increment measurement count in session if session_id provided
    if (session_id) {
      const sess = (inMemoryStore.sessions || []).find(s => s.session_id === session_id);
      if (sess) {
        sess.physical_measurements_recorded = (sess.physical_measurements_recorded || 0) + 1;
      }
    }

    return res.status(201).json({ success: true, data: measurement });
  } catch (error) {
    console.error('Error recording quantity verification measurement:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/inspections/measurements/list - List measurements
router.get('/measurements/list', (req, res) => {
  const { session_id } = req.query;
  let measurements = inMemoryStore.measurements || [];
  if (session_id) {
    measurements = measurements.filter(m => m.session_id === session_id);
  }
  return res.json({ success: true, count: measurements.length, data: measurements });
});

export default router;
