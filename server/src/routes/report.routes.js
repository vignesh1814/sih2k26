import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Report } from '../models/Report.js';
import { Scan } from '../models/Scan.js';
import { inMemoryStore, isDbConnected } from '../db.js';
import { ReportService } from '../services/reportService.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const reportsDir = path.resolve(__dirname, '..', '..', 'reports');

const router = Router();

// List generated reports
router.get('/reports', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    if (isDbConnected()) {
      const reports = await Report.find().sort({ generated_at: -1 }).limit(limit).lean();
      return res.json({ reports, count: reports.length });
    }
    const reports = (inMemoryStore.reports || []).slice(0, limit);
    return res.json({ reports, count: reports.length });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// Generate PDF statutory report
router.post('/report/generate', async (req, res) => {
  try {
    const { scan_id, officer_name, station_jurisdiction, notes } = req.body;
    if (!scan_id) {
      return res.status(400).json({ message: 'scan_id is required' });
    }

    let scanData = null;
    if (isDbConnected()) {
      scanData = await Scan.findOne({ scan_id }).lean();
    }
    if (!scanData) {
      scanData = (inMemoryStore.scans || []).find(s => s.scan_id === scan_id);
    }

    const { pdf_path, pdf_url, evidence_hash } = await ReportService.generateReport({
      scanId: scan_id,
      scanData: scanData || {},
      officerName: officer_name || 'Enforcement Officer',
      station: station_jurisdiction || 'Legal Metrology District Office',
      notes: notes || ''
    });

    const reportId = uuidv4();
    const reportDoc = {
      report_id: reportId,
      scan_id,
      officer_name,
      station_jurisdiction,
      pdf_url,
      evidence_hash,
      status: 'COMPLETED',
      generated_at: new Date(),
      notes
    };

    if (isDbConnected()) {
      try { await Report.create(reportDoc); } catch (e) {}
    } else {
      inMemoryStore.reports.unshift(reportDoc);
    }

    return res.json({
      report_id: reportId,
      pdf_url,
      download_url: `/api/v1/report/${scan_id}/download`,
      evidence_hash,
      generated_at: new Date().toISOString(),
      status: 'COMPLETED'
    });
  } catch (err) {
    console.error('[Report Generation Error]', err);
    return res.status(500).json({ message: `Report generation failed: ${err.message}` });
  }
});

// Direct download by scan_id (handles frontend pattern: /api/v1/report/:scan_id/download)
router.get('/report/:scan_id/download', async (req, res) => {
  try {
    const { scan_id } = req.params;

    // Check if report document exists
    let reportDoc = null;
    if (isDbConnected()) {
      reportDoc = await Report.findOne({ scan_id }).sort({ generated_at: -1 }).lean();
    }
    if (!reportDoc) {
      reportDoc = (inMemoryStore.reports || []).find(r => r.scan_id === scan_id);
    }

    if (reportDoc && reportDoc.pdf_url) {
      const filename = path.basename(reportDoc.pdf_url);
      const filePath = path.join(reportsDir, filename);
      if (fs.existsSync(filePath)) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="LMPC_Report_${scan_id.slice(0, 8)}.pdf"`);
        return res.sendFile(filePath);
      }
    }

    // If PDF not already generated on disk, generate it dynamically on the fly
    let scanData = null;
    if (isDbConnected()) {
      scanData = await Scan.findOne({ scan_id }).lean();
    }
    if (!scanData) {
      scanData = (inMemoryStore.scans || []).find(s => s.scan_id === scan_id);
    }

    const { pdf_path } = await ReportService.generateReport({
      scanId: scan_id,
      scanData: scanData || { scan_id, declarations: {}, violations: [] },
      officerName: 'Field Inspector',
      station: 'District Legal Metrology Unit',
      notes: 'Generated via direct statutory report download'
    });

    if (fs.existsSync(pdf_path)) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="LMPC_Report_${scan_id.slice(0, 8)}.pdf"`);
      return res.sendFile(pdf_path);
    }

    return res.status(404).json({ message: 'Inspection report could not be generated' });
  } catch (err) {
    console.error('[Download Error]', err);
    return res.status(500).json({ message: `Download failed: ${err.message}` });
  }
});

// Download PDF file by direct filename
router.get('/report/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(reportsDir, filename);

  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.sendFile(filePath);
  }
  return res.status(404).json({ message: 'Report PDF file not found' });
});

export default router;
