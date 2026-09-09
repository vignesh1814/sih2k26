import express from 'express';
import InspectionSession from '../models/InspectionSession.js';
import Measurement from '../models/Measurement.js';
import { Scan } from '../models/Scan.js';
import { Report } from '../models/Report.js';
import { AuditLog } from '../models/AuditLog.js';
import { ReportService } from '../services/reportService.js';
import { inMemoryStore, isDbConnected } from '../db.js';
import { v4 as uuidv4 } from 'uuid';

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

// POST /api/inspections/start - Start new inspection session (No external registry needed)
router.post('/start', async (req, res) => {
  try {
    const {
      inspector_id = 'INSP-LM-2026-001',
      inspector_name = 'Field Inspector',
      jurisdiction_district = 'Hyderabad District',
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
      entity_name: entity_name || 'Inspected Establishment',
      entity_reg_no: entity_reg_no || null,
      entity_type: entity_type || 'Manufacturer / Packer',
      premises_address: premises_address || 'Premises under inspection',
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

      const sessions = await InspectionSession.find(filter).sort({ started_at: -1 }).lean();
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

// GET /api/inspections/:session_id - Get session with attached measurements and scans
router.get('/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;

    let session = null;
    let measurements = [];
    let scans = [];

    if (isDbConnected()) {
      session = await InspectionSession.findOne({ session_id }).lean();
      if (session) {
        measurements = await Measurement.find({ session_id }).sort({ created_at: -1 }).lean();
        scans = await Scan.find({ session_id }).sort({ created_at: -1 }).lean();
      }
    } else {
      session = (inMemoryStore.sessions || []).find(s => s.session_id === session_id);
      measurements = (inMemoryStore.measurements || []).filter(m => m.session_id === session_id);
      scans = (inMemoryStore.scans || []).filter(s => s.session_id === session_id);
    }

    if (!session) {
      return res.status(404).json({ success: false, message: 'Inspection session not found' });
    }

    return res.json({
      success: true,
      data: {
        ...session,
        measurements,
        scans
      }
    });
  } catch (error) {
    console.error('Error fetching session details:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/inspections/measurement - Record physical weight/measure verification (Persistent in DB)
router.post('/measurement', async (req, res) => {
  try {
    const {
      session_id,
      scan_id = null,
      sample_no = `SMPL-${Math.floor(100 + Math.random() * 900)}`,
      product_name = 'Inspected Commodity Package',
      declared_quantity,
      declared_unit = 'g',
      actual_quantity,
      instrument_type = 'Class II Digital Electronic Precision Balance',
      instrument_certificate_no = `LM/VER/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
      officer_name = 'Field Inspector'
    } = req.body;

    const declaredVal = parseFloat(declared_quantity) || 0;
    const actualVal = parseFloat(actual_quantity) || 0;
    const diff = Math.round((actualVal - declaredVal) * 100) / 100;

    // Evaluate against MPE Schedule
    const mpe = calculateMPE(declaredVal, declared_unit);
    const maxAllowedDeficit = mpe.permissible_limit_grams;

    // Convert diff to grams for comparison if declared in kg/l
    let diffInGrams = diff;
    if (['kg', 'l', 'litre', 'liter'].includes(declared_unit.toLowerCase())) {
      diffInGrams = diff * 1000;
    }

    const isDeficient = diffInGrams < 0 && Math.abs(diffInGrams) > maxAllowedDeficit;
    const isCompliant = !isDeficient;
    const result = isCompliant ? 'PASS' : 'FAIL';

    const reason = isDeficient
      ? `Net deficiency of ${Math.abs(diffInGrams).toFixed(1)}g exceeds Maximum Permissible Error (MPE) limit of ${maxAllowedDeficit}g under ${mpe.rule_citation}.`
      : `Net quantity deviation of ${diff > 0 ? '+' : ''}${diff}${declared_unit} is within statutory tolerance (MPE limit: ±${maxAllowedDeficit}g).`;

    const measurementDoc = {
      measurement_id: `MSR-${Date.now().toString(36).toUpperCase()}`,
      session_id: session_id || null,
      scan_id: scan_id || null,
      sample_no,
      product_name,
      declared_quantity: declaredVal,
      declared_unit,
      measured_quantity: actualVal,
      mpe_limit: maxAllowedDeficit,
      deviation: diff,
      deviation_percentage: declaredVal > 0 ? Math.round((diff / declaredVal) * 10000) / 100 : 0,
      is_compliant: isCompliant,
      instrument_type,
      instrument_certificate_no,
      officer_name,
      result,
      reason,
      created_at: new Date()
    };

    if (isDbConnected()) {
      try {
        const saved = await Measurement.create(measurementDoc);
        if (session_id) {
          await InspectionSession.findOneAndUpdate(
            { session_id },
            { $inc: { physical_measurements_recorded: 1 } }
          );
        }
        return res.status(201).json({ success: true, data: saved });
      } catch (dbErr) {
        console.warn('[MongoDB Measurement Save Error]', dbErr.message);
      }
    }

    inMemoryStore.measurements = inMemoryStore.measurements || [];
    inMemoryStore.measurements.unshift(measurementDoc);

    if (session_id) {
      const sess = (inMemoryStore.sessions || []).find(s => s.session_id === session_id);
      if (sess) {
        sess.physical_measurements_recorded = (sess.physical_measurements_recorded || 0) + 1;
      }
    }

    return res.status(201).json({ success: true, data: measurementDoc });
  } catch (error) {
    console.error('Error recording quantity verification measurement:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/inspections/measurements/list - List measurements
router.get('/measurements/list', async (req, res) => {
  try {
    const { session_id } = req.query;
    if (isDbConnected()) {
      const query = session_id ? { session_id } : {};
      const measurements = await Measurement.find(query).sort({ created_at: -1 }).lean();
      return res.json({ success: true, count: measurements.length, data: measurements });
    }

    let measurements = inMemoryStore.measurements || [];
    if (session_id) {
      measurements = measurements.filter(m => m.session_id === session_id);
    }
    return res.json({ success: true, count: measurements.length, data: measurements });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/inspections/:session_id/close or /complete - Finalize inspection session and update reports
router.post(['/:session_id/close', '/:session_id/complete'], async (req, res) => {
  try {
    const { session_id } = req.params;
    const {
      officer_observations,
      action_recommended,
      inspector_name = 'Field Inspector'
    } = req.body;

    let session = null;
    let scans = [];
    let measurements = [];

    if (isDbConnected()) {
      session = await InspectionSession.findOne({ session_id });
      if (session) {
        scans = await Scan.find({ session_id }).lean();
        measurements = await Measurement.find({ session_id }).lean();
      }
    } else {
      session = (inMemoryStore.sessions || []).find(s => s.session_id === session_id);
      scans = (inMemoryStore.scans || []).filter(s => s.session_id === session_id);
      measurements = (inMemoryStore.measurements || []).filter(m => m.session_id === session_id);
    }

    if (!session) {
      return res.status(404).json({ success: false, message: 'Inspection session not found' });
    }

    // Compute exact inspection aggregates
    const packagesInspected = scans.length;
    const compliantCount = scans.filter(s => s.status === 'PASS').length;
    const nonCompliantCount = scans.filter(s => s.status === 'FAIL').length;
    const reviewRequiredCount = scans.filter(s => s.status === 'NEEDS_REVIEW').length;
    const measurementViolations = measurements.filter(m => m.result === 'FAIL').length;
    
    let totalViolations = 0;
    scans.forEach(s => {
      if (Array.isArray(s.violations)) totalViolations += s.violations.length;
    });
    totalViolations += measurementViolations;

    const recommendedAction = action_recommended || (nonCompliantCount > 0 || measurementViolations > 0 ? 'STATUTORY_CHALLAN' : 'NONE');
    const observations = officer_observations || session.officer_observations || (
      nonCompliantCount > 0 
        ? `Found ${nonCompliantCount} non-compliant packages with ${totalViolations} statutory defect(s). Enforcement action recommended.`
        : `All ${packagesInspected || 'inspected'} commodity packages verified compliant with PCR 2011.`
    );

    // Update session object
    session.status = 'COMPLETED';
    session.completed_at = new Date();
    session.packages_inspected = packagesInspected;
    session.compliant_count = compliantCount;
    session.non_compliant_count = nonCompliantCount;
    session.review_required_count = reviewRequiredCount;
    session.violations_detected = totalViolations;
    session.physical_measurements_recorded = measurements.length;
    session.officer_observations = observations;
    session.action_recommended = recommendedAction;

    if (isDbConnected()) {
      await session.save();
    }

    // Ensure all scans from this session have valid Report entries for the Reports page
    let reportsCreated = 0;
    for (const scan of scans) {
      try {
        const existingReport = isDbConnected() 
          ? await Report.findOne({ scan_id: scan.scan_id })
          : (inMemoryStore.reports || []).find(r => r.scan_id === scan.scan_id);

        if (!existingReport) {
          const { pdf_url, evidence_hash } = await ReportService.generateReport({
            scanId: scan.scan_id,
            scanData: scan,
            officerName: inspector_name || session.inspector_name || 'Field Inspector',
            station: `${session.jurisdiction_district || 'District'} Legal Metrology Wing`,
            notes: `Inspection Session: ${session.session_id} - ${session.entity_name}`
          });

          const reportDoc = {
            report_id: uuidv4(),
            scan_id: scan.scan_id,
            officer_name: inspector_name || session.inspector_name || 'Field Inspector',
            station_jurisdiction: `${session.jurisdiction_district || 'District'} Legal Metrology Wing`,
            pdf_url,
            evidence_hash,
            status: 'COMPLETED',
            generated_at: new Date(),
            notes: `Session: ${session.session_id}`
          };

          if (isDbConnected()) {
            await Report.create(reportDoc);
          } else {
            inMemoryStore.reports = inMemoryStore.reports || [];
            inMemoryStore.reports.unshift(reportDoc);
          }
          reportsCreated++;
        }
      } catch (repErr) {
        console.warn(`[Report Sync Error for ${scan.scan_id}]:`, repErr.message);
      }
    }

    // Record Audit Log
    const auditDoc = {
      timestamp: new Date(),
      user_name: inspector_name || session.inspector_name || 'Field Inspector',
      user_role: 'INSPECTOR',
      action: 'CLOSE_INSPECTION_SESSION',
      resource: `SESSION:${session_id}`,
      details: `Closed inspection session for ${session.entity_name}: ${packagesInspected} packages audited (${nonCompliantCount} non-compliant, ${totalViolations} violations).`,
      status: 'SUCCESS',
      ip_address: req.ip || '127.0.0.1'
    };

    if (isDbConnected()) {
      try { await AuditLog.create(auditDoc); } catch (e) {}
    } else {
      inMemoryStore.auditLogs = inMemoryStore.auditLogs || [];
      inMemoryStore.auditLogs.unshift(auditDoc);
    }

    return res.json({
      success: true,
      message: `Inspection session ${session_id} successfully closed and reports updated.`,
      session,
      packages_inspected: packagesInspected,
      non_compliant_count: nonCompliantCount,
      violations_detected: totalViolations,
      reports_created_or_synced: reportsCreated
    });
  } catch (error) {
    console.error('Error closing inspection session:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
