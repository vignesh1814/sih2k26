import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Report } from '../models/Report.js';
import { Scan } from '../models/Scan.js';
import { inMemoryStore, isDbConnected } from '../db.js';
import { ReportService } from '../services/reportService.js';

const router = Router();

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
      scanData = inMemoryStore.scans.find(s => s.scan_id === scan_id);
    }

    const { pdf_path, pdf_url, evidence_hash } = await ReportService.generateReport({
      scanId: scan_id,
      scanData: scanData || {},
      officerName: officer_name || 'Enforcement Officer',
      station: station_jurisdiction || 'Legal Metrology Central Enforcement Wing',
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
      evidence_hash,
      generated_at: new Date().toISOString(),
      status: 'COMPLETED'
    });
  } catch (err) {
    console.error('[Report Generation Error]', err);
    return res.status(500).json({ message: `Report generation failed: ${err.message}` });
  }
});

// Download PDF file
router.get('/report/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(process.cwd(), 'server', 'reports', filename);

  if (fs.existsSync(filePath)) {
    return res.download(filePath, filename);
  }
  return res.status(404).json({ message: 'Report PDF file not found' });
});

export default router;
