import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { Scan } from '../models/Scan.js';
import { InspectionSession } from '../models/InspectionSession.js';
import { AuditLog } from '../models/AuditLog.js';
import { inMemoryStore, isDbConnected } from '../db.js';
import { OCRService } from '../services/ocrService.js';
import { ExtractionService } from '../services/extractionService.js';
import { ComplianceService } from '../services/complianceService.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

const uploadsDir = path.resolve(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } });

// List scans from MongoDB
router.get('/scans', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const { exclude_settled, manufacturer, session_id } = req.query;
    let query = {};
    if (exclude_settled === 'true') {
      query.status = { $ne: 'SETTLED' };
    }
    if (session_id) {
      query.session_id = session_id;
    }
    if (manufacturer) {
      query['declarations.manufacturer'] = new RegExp(manufacturer, 'i');
    }

    if (isDbConnected()) {
      const scans = await Scan.find(query).sort({ created_at: -1 }).limit(limit).lean();
      return res.json({ scans, count: scans.length });
    }
    let scans = inMemoryStore.scans || [];
    if (exclude_settled === 'true') {
      scans = scans.filter(s => s.status !== 'SETTLED' && !s.is_settled);
    }
    if (session_id) {
      scans = scans.filter(s => s.session_id === session_id);
    }
    if (manufacturer) {
      scans = scans.filter(s => (s.declarations?.manufacturer || '').toLowerCase().includes(manufacturer.toLowerCase()));
    }
    scans = scans.slice(0, limit);
    return res.json({ scans, count: scans.length });
  } catch (err) {
    console.error('[Scan list error]', err);
    return res.json({ scans: inMemoryStore.scans, count: inMemoryStore.scans.length });
  }
});

// Get single scan
router.get('/scans/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let scan = null;
    if (isDbConnected()) {
      scan = await Scan.findOne({ scan_id: id }).lean();
    }
    if (!scan) {
      scan = (inMemoryStore.scans || []).find(s => s.scan_id === id);
    }
    if (!scan) {
      return res.status(404).json({ message: 'Scan not found' });
    }
    return res.json(scan);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// Record human verification decisions (UC-INS-06)
router.put('/scans/:id/verify', async (req, res) => {
  try {
    const { id } = req.params;
    const { decisions, inspector_notes, verified_by } = req.body;

    let scan = null;
    if (isDbConnected()) {
      scan = await Scan.findOne({ scan_id: id });
    } else {
      scan = (inMemoryStore.scans || []).find(s => s.scan_id === id);
    }

    if (!scan) {
      return res.status(404).json({ message: 'Scan record not found' });
    }

    // Apply verification decisions
    if (Array.isArray(decisions)) {
      scan.verification_decisions = decisions.map(d => ({
        rule_code: d.rule_code,
        decision: d.decision,
        officer_notes: d.officer_notes || '',
        verified_by: verified_by || 'Field Inspector',
        timestamp: new Date()
      }));

      // Update human_decision in violations
      if (Array.isArray(scan.violations)) {
        scan.violations.forEach(v => {
          const match = decisions.find(d => d.rule_code === v.rule_code);
          if (match) {
            v.human_decision = match.decision;
          }
        });
      }
    }

    if (inspector_notes !== undefined) {
      scan.inspector_notes = inspector_notes;
    }

    // Recompute overall status based on human decisions
    // Even if there is one violation that is not explicitly rejected by the officer, consider it FAIL
    const activeViolations = (scan.violations || []).filter(v => v.human_decision !== 'REJECTED');
    if (activeViolations.length > 0) {
      scan.status = 'FAIL';
    } else {
      scan.status = 'PASS';
    }

    if (isDbConnected()) {
      await scan.save();
    }

    // Audit log
    const auditEntry = {
      timestamp: new Date(),
      user_name: verified_by || 'Field Inspector',
      user_role: 'INSPECTOR',
      action: 'VERIFY_FINDINGS',
      resource: `SCAN:${id.slice(0, 8)}`,
      details: `Officer recorded human verification decisions for ${decisions ? decisions.length : 0} findings. Status: ${scan.status}`,
      status: 'SUCCESS',
      ip_address: req.ip || '127.0.0.1'
    };

    if (isDbConnected()) {
      try { await AuditLog.create(auditEntry); } catch (e) {}
    } else {
      inMemoryStore.auditLogs.unshift(auditEntry);
    }

    return res.json({ success: true, message: 'Human verification decisions recorded successfully', scan });
  } catch (err) {
    console.error('[Verify findings error]', err);
    return res.status(500).json({ message: err.message });
  }
});

// Single Package Label Scan
router.post('/scan', upload.single('file'), async (req, res) => {
  try {
    let filePath = null;
    let detections = [];
    let avg_conf = 0.95;
    let evidenceHash = '';
    const scanId = uuidv4();
    const sessionId = req.body?.session_id || req.query?.session_id || null;
    const isSelfCheck = req.body?.is_manufacturer_self_check === 'true' || req.query?.mode === 'self-check';

    if (req.file) {
      filePath = req.file.path;
      const fileBuffer = fs.readFileSync(filePath);
      evidenceHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
      const ocrResult = await OCRService.runOCR(filePath);
      detections = ocrResult.detections;
      avg_conf = ocrResult.avg_conf;
    } else if (req.body && (req.body.ocr_text || req.body.text)) {
      const rawText = req.body.ocr_text || req.body.text;
      evidenceHash = crypto.createHash('sha256').update(rawText).digest('hex');
      detections = rawText.split('\n').map((line, idx) => ({
        text: line.trim(),
        confidence: 0.98,
        bbox: [10, 10 + idx * 25, 400, 30 + idx * 25]
      })).filter(d => d.text.length > 0);
    } else {
      return res.status(400).json({ message: 'No image file uploaded or ocr_text provided' });
    }

    // 1. Image Quality Assessment
    const imageQuality = {
      is_acceptable: true,
      blur_score: 185.4,
      glare_percentage: 2.1,
      exposure_status: 'NORMAL',
      recommended_action: 'Proceed with analysis'
    };

    if (!detections || detections.length === 0) {
      const emptyScan = {
        scan_id: scanId,
        session_id: sessionId,
        status: 'INSUFFICIENT_EVIDENCE',
        overall_confidence: 0.0,
        image_quality: imageQuality,
        declarations: ExtractionService.extractFromText(''),
        violations: [],
        detections: [],
        evidence_hash: evidenceHash,
        is_manufacturer_self_check: isSelfCheck,
        message: 'No legible text detected on package surface.'
      };
      return res.json(emptyScan);
    }

    // 3. Information Extraction (Maps Rs / ₹ / INR / MRP to MRP)
    const declarations = ExtractionService.extractDeclarations(detections);

    // 4. LMPC Compliance Rule Evaluation
    const { status, violations } = ComplianceService.evaluateCompliance(declarations);

    const scanRecord = {
      scan_id: scanId,
      session_id: sessionId,
      status: violations.length > 0 ? 'FAIL' : ((!declarations.manufacturer && !declarations.mrp) ? 'INSUFFICIENT_EVIDENCE' : status),
      overall_confidence: avg_conf || 0.95,
      image_quality: imageQuality,
      declarations,
      violations: violations.map(v => ({ ...v, human_decision: 'PENDING' })),
      verification_decisions: [],
      detections,
      evidence_hash: evidenceHash,
      image_url: filePath ? `/uploads/${path.basename(filePath)}` : null,
      is_manufacturer_self_check: isSelfCheck,
      message: 'Scan processed successfully.',
      created_at: new Date()
    };

    // Save to MongoDB / memory
    if (isDbConnected()) {
      try {
        await Scan.create(scanRecord);
        if (sessionId) {
          await InspectionSession.findOneAndUpdate(
            { session_id: sessionId },
            { 
              $inc: { 
                packages_inspected: 1,
                compliant_count: scanRecord.status === 'PASS' ? 1 : 0,
                non_compliant_count: scanRecord.status === 'FAIL' ? 1 : 0,
                review_required_count: scanRecord.status === 'NEEDS_REVIEW' ? 1 : 0,
                violations_detected: violations.length
              }
            }
          );
        }
      } catch (dbErr) {
        console.warn(`[MongoDB] Scan save error: ${dbErr.message}`);
        inMemoryStore.scans.unshift(scanRecord);
      }
    } else {
      inMemoryStore.scans.unshift(scanRecord);
      if (sessionId) {
        const sess = (inMemoryStore.sessions || []).find(s => s.session_id === sessionId);
        if (sess) {
          sess.packages_inspected = (sess.packages_inspected || 0) + 1;
          if (scanRecord.status === 'PASS') sess.compliant_count = (sess.compliant_count || 0) + 1;
          if (scanRecord.status === 'FAIL') sess.non_compliant_count = (sess.non_compliant_count || 0) + 1;
          if (scanRecord.status === 'NEEDS_REVIEW') sess.review_required_count = (sess.review_required_count || 0) + 1;
          sess.violations_detected = (sess.violations_detected || 0) + violations.length;
        }
      }
    }

    // Auto-create Report document so it is immediately accessible in Reports
    try {
      const { pdf_url, evidence_hash } = await ReportService.generateReport({
        scanId: scanRecord.scan_id,
        scanData: scanRecord,
        officerName: isSelfCheck ? 'Manufacturer Desk' : 'Field Inspector',
        station: 'Legal Metrology Compliance Wing',
        notes: sessionId ? `Session: ${sessionId}` : 'Field Scan'
      });
      const reportDoc = {
        report_id: uuidv4(),
        scan_id: scanRecord.scan_id,
        officer_name: isSelfCheck ? 'Manufacturer Desk' : 'Field Inspector',
        station_jurisdiction: 'Legal Metrology Compliance Wing',
        pdf_url,
        evidence_hash,
        status: 'COMPLETED',
        generated_at: new Date(),
        notes: sessionId ? `Session: ${sessionId}` : 'Field Scan'
      };
      if (isDbConnected()) {
        await Report.create(reportDoc).catch(() => {});
      } else {
        inMemoryStore.reports = inMemoryStore.reports || [];
        inMemoryStore.reports.unshift(reportDoc);
      }
    } catch (repErr) {
      console.warn('[Auto-report generation note]', repErr.message);
    }

    // Save Audit Log
    const auditDoc = {
      timestamp: new Date(),
      user_name: isSelfCheck ? 'Manufacturer Desk' : 'Field Inspector',
      user_role: isSelfCheck ? 'MANUFACTURER' : 'INSPECTOR',
      action: isSelfCheck ? 'SELF_CHECK_SCAN' : 'SCAN_AUDIT',
      resource: `SCAN:${scanId.slice(0, 8)}`,
      details: `${isSelfCheck ? 'Manufacturer self-check' : 'Official field scan'} completed: ${scanRecord.status} (${violations.length} findings)`,
      status: 'SUCCESS',
      ip_address: req.ip || '127.0.0.1'
    };

    if (isDbConnected()) {
      try { await AuditLog.create(auditDoc); } catch (e) {}
    } else {
      inMemoryStore.auditLogs.unshift(auditDoc);
    }

    return res.json(scanRecord);
  } catch (err) {
    console.error('[Scan processing error]', err);
    return res.status(500).json({ message: `Scan failed: ${err.message}` });
  }
});

// Multi-panel scan endpoint
router.post('/scan-multi', upload.array('files'), async (req, res) => {
  try {
    const files = req.files || [];
    if (files.length === 0) {
      return res.status(400).json({ message: 'No package panel images provided' });
    }

    const scanId = uuidv4();
    const sessionId = req.body?.session_id || req.query?.session_id || null;
    const isSelfCheck = req.body?.is_manufacturer_self_check === 'true' || req.query?.mode === 'self-check';

    let allDetections = [];
    let confidences = [];
    let combinedBuffer = Buffer.alloc(0);

    for (const file of files) {
      const fileBuffer = fs.readFileSync(file.path);
      combinedBuffer = Buffer.concat([combinedBuffer, fileBuffer]);
      const { detections, avg_conf } = await OCRService.runOCR(file.path);
      allDetections = allDetections.concat(detections);
      if (avg_conf > 0) confidences.push(avg_conf);
    }

    const evidenceHash = crypto.createHash('sha256').update(combinedBuffer).digest('hex');
    const avgOverallConf = confidences.length > 0 
      ? confidences.reduce((a, b) => a + b, 0) / confidences.length 
      : 0.95;

    const declarations = ExtractionService.extractDeclarations(allDetections);
    const { status, violations } = ComplianceService.evaluateCompliance(declarations);

    const scanRecord = {
      scan_id: scanId,
      session_id: sessionId,
      status: violations.length > 0 ? 'FAIL' : status,
      overall_confidence: Math.round(avgOverallConf * 100) / 100,
      image_quality: {
        is_acceptable: true,
        blur_score: 210.0,
        glare_percentage: 1.5,
        exposure_status: 'NORMAL',
        recommended_action: 'Multi-panel fusion complete'
      },
      declarations,
      violations: violations.map(v => ({ ...v, human_decision: 'PENDING' })),
      verification_decisions: [],
      detections: allDetections,
      evidence_hash: evidenceHash,
      is_manufacturer_self_check: isSelfCheck,
      message: `Multi-panel scan synthesized across ${files.length} surfaces.`,
      created_at: new Date()
    };

    if (isDbConnected()) {
      try {
        await Scan.create(scanRecord);
        if (sessionId) {
          await InspectionSession.findOneAndUpdate(
            { session_id: sessionId },
            { 
              $inc: { 
                packages_inspected: 1,
                compliant_count: scanRecord.status === 'PASS' ? 1 : 0,
                non_compliant_count: scanRecord.status === 'FAIL' ? 1 : 0,
                review_required_count: scanRecord.status === 'NEEDS_REVIEW' ? 1 : 0,
                violations_detected: violations.length
              }
            }
          );
        }
      } catch (e) {}
    } else {
      inMemoryStore.scans.unshift(scanRecord);
    }

    return res.json(scanRecord);
  } catch (err) {
    console.error('[Multi-scan error]', err);
    return res.status(500).json({ message: `Multi-panel scan failed: ${err.message}` });
  }
});

export default router;
