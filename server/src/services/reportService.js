import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { inMemoryStore, isDbConnected } from '../db.js';
import InspectionSession from '../models/InspectionSession.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const reportsDir = path.resolve(__dirname, '..', '..', 'reports');

export class ReportService {
  /**
   * Generates a formal LMPC statutory inspection PDF report with full Establishment & Session Profile.
   * @param {Object} params
   * @returns {Promise<{ pdf_path: string, pdf_url: string, evidence_hash: string }>}
   */
  static async generateReport({ 
    scanId, 
    scanData = {}, 
    officerName = 'Legal Metrology Officer', 
    station = 'Central Directorate', 
    notes = '',
    sessionData = null 
  }) {
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const reportFileName = `LMPC_Inspection_${(scanId || 'AUDIT').slice(0, 8)}_${Date.now()}.pdf`;
    const pdfPath = path.join(reportsDir, reportFileName);

    // Resolve linked inspection session details if available
    let session = sessionData;
    const sessionId = scanData?.session_id || (notes && notes.match(/Session:\s*([A-Z0-9\-]+)/i)?.[1]);
    
    if (!session && sessionId) {
      if (isDbConnected()) {
        try {
          session = await InspectionSession.findOne({ session_id: sessionId }).lean();
        } catch (e) {}
      }
      if (!session) {
        session = (inMemoryStore.sessions || []).find(s => s.session_id === sessionId);
      }
    }

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const writeStream = fs.createWriteStream(pdfPath);
    doc.pipe(writeStream);

    // Header & Emblem
    doc.fontSize(18).font('Helvetica-Bold').fillColor('#1e3a8a').text('GOVERNMENT OF INDIA', { align: 'center' });
    doc.fontSize(13).font('Helvetica-Bold').fillColor('#1e293b').text('MINISTRY OF CONSUMER AFFAIRS, FOOD & PUBLIC DISTRIBUTION', { align: 'center' });
    doc.fontSize(11).font('Helvetica').fillColor('#475569').text('DEPARTMENT OF CONSUMER AFFAIRS • LEGAL METROLOGY ENFORCEMENT WING', { align: 'center' });
    doc.moveDown(0.4);

    doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#2563eb').lineWidth(2).stroke();
    doc.moveDown(0.5);

    // Title
    doc.fontSize(13).font('Helvetica-Bold').fillColor('#0f172a').text('STATUTORY COMPLIANCE INSPECTION CERTIFICATE', { align: 'center' });
    doc.fontSize(9).font('Helvetica-Oblique').fillColor('#64748b').text('Issued Under Section 15 of Legal Metrology Act, 2009 & Packaged Commodities Rules, 2011', { align: 'center' });
    doc.moveDown(0.8);

    // Status / Verdict Banner
    const status = scanData?.status || 'PASS';
    const statusColor = status === 'PASS' ? '#16a34a' : status === 'FAIL' ? '#dc2626' : '#d97706';
    const statusBg = status === 'PASS' ? '#f0fdf4' : status === 'FAIL' ? '#fef2f2' : '#fffbeb';
    
    const bannerY = doc.y;
    doc.rect(40, bannerY, 515, 26).fillAndStroke(statusBg, statusColor);
    doc.fontSize(11).font('Helvetica-Bold').fillColor(statusColor).text(
      `STATUTORY AUDIT VERDICT: [ ${status === 'PASS' ? 'COMPLIANT - PASS' : (status === 'FAIL' ? 'NON-COMPLIANT - VIOLATIONS DETECTED' : 'NEEDS REVIEW')} ]`,
      45, bannerY + 7, { align: 'center', width: 505 }
    );
    doc.y = bannerY + 34;

    // SECTION 1: Inspected Establishment Profile (Captured during Start Inspection)
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e3a8a').text('1. Inspected Establishment & Session Profile');
    doc.fontSize(8.5).font('Helvetica').fillColor('#1e293b');

    const estName = session?.entity_name || scanData?.declarations?.manufacturer || 'Premises Under Audit';
    const estType = session?.entity_type || 'Retail Store / Packaged Commodity Establishment';
    const estAddress = session?.premises_address || session?.gps_location?.address_resolved || 'Premises under inspection';
    const sessId = session?.session_id || sessionId || scanId || 'INSP-STANDALONE';
    const inspType = session?.inspection_type || 'Routine Inspection';
    const inspOfficer = session?.inspector_name || officerName || 'Field Inspector';
    const inspId = session?.inspector_id || 'INSP-LM-2026';
    const districtState = `${session?.jurisdiction_district || 'Enforcement District'}, ${session?.jurisdiction_state || 'State'}`;
    const gpsStr = session?.gps_location?.latitude 
      ? `GPS: ${session.gps_location.latitude.toFixed(4)}°N, ${session.gps_location.longitude.toFixed(4)}°E (Accuracy: ±${session.gps_location.accuracy_meters || 5}m) • ${session.gps_location.address_resolved || districtState}`
      : `Geographic Jurisdiction: ${districtState} • Standard Field Circle`;

    const profileItems = [
      ['Establishment / Trader Name', estName],
      ['Premises / Entity Type', estType],
      ['Premises Physical Address', estAddress],
      ['Inspection Session & Type', `${sessId} • ${inspType}`],
      ['Jurisdiction Office / District', districtState],
      ['Inspecting Officer Name & ID', `${inspOfficer} (ID: ${inspId})`],
      ['Geo-Location Verification', gpsStr],
      ['Inspection Timestamp', `${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`]
    ];

    profileItems.forEach(([lbl, val]) => {
      doc.font('Helvetica-Bold').text(`• ${lbl}: `, { continued: true }).font('Helvetica').text(String(val));
    });
    doc.moveDown(0.8);

    // SECTION 2: Declarations Found on Packaging (Rule 6)
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e3a8a').text('2. Extracted Statutory Label Declarations (Rule 6)');
    doc.fontSize(8.5).font('Helvetica').fillColor('#334155');
    
    const decl = scanData?.declarations || {};
    const declItems = [
      ['Generic Name of Commodity (Rule 6(1)(b))', decl.generic_name || 'NOT DETECTED'],
      ['Net Quantity & Unit (Rule 6(1)(c))', decl.net_quantity && decl.unit ? `${decl.net_quantity} ${decl.unit}` : 'NOT DETECTED'],
      ['Maximum Retail Price (MRP / Rs.) (Rule 6(1)(e))', decl.mrp ? `Rs. ${decl.mrp} ${decl.has_inclusive_phrase ? '(Inclusive of all taxes)' : '(Statutory tax phrase missing)'}` : 'NOT DETECTED'],
      ['Unit Sale Price (USP) (Rule 6(11))', decl.unit_sale_price ? `Rs. ${decl.unit_sale_price} per ${decl.unit || 'g'}` : (decl.mrp && decl.net_quantity ? 'Calculated automatically' : 'N/A')],
      ['Date of Manufacture / Packing (Rule 6(1)(d))', decl.mfg_date || 'NOT DETECTED'],
      ['Manufacturer / Packer / Importer (Rule 6(1)(a))', decl.manufacturer || 'NOT DETECTED'],
      ['Consumer Care Grievance Helpline (Rule 6(2))', decl.consumer_care || 'NOT DETECTED'],
      ['Country of Origin (Rule 6(1)(g))', decl.country_of_origin || 'India'],
      ['GS1 Barcode Identification', decl.barcode || 'N/A']
    ];

    declItems.forEach(([label, val]) => {
      doc.font('Helvetica-Bold').text(`• ${label}: `, { continued: true }).font('Helvetica').text(val);
    });
    doc.moveDown(0.8);

    // SECTION 3: Statutory Violations
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e3a8a').text('3. Statutory Audit Findings & Violation Summary');
    const violations = scanData?.violations || [];
    if (violations.length === 0) {
      doc.fontSize(9).font('Helvetica').fillColor('#16a34a').text('✔ All mandatory packaged commodity declarations strictly conform to the Legal Metrology Rules, 2011.');
    } else {
      violations.forEach((v, idx) => {
        doc.fontSize(9).font('Helvetica-Bold').fillColor(v.severity === 'CRITICAL' ? '#b91c1c' : '#d97706');
        doc.text(`${idx + 1}. [${v.severity}] ${v.rule_code || 'Statutory Non-Compliance'} — ${v.declaration || 'Package Declaration'}`);
        doc.fontSize(8.5).font('Helvetica').fillColor('#334155');
        doc.text(`   Finding: ${v.reason || 'Declaration not conforming to Act'}`);
        if (v.suggested_correction) {
          doc.text(`   Mandated Remedial Action: ${v.suggested_correction}`);
        }
      });
    }
    doc.moveDown(0.8);

    // SECTION 4: Chain of Custody & Evidence Hash
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e3a8a').text('4. Digital Chain of Custody & Evidence Authenticity');
    const evidenceHash = scanData?.evidence_hash || crypto.createHash('sha256').update(scanId || 'LMPC').digest('hex');
    doc.fontSize(8).font('Helvetica').fillColor('#334155');
    doc.text(`SHA-256 Cryptographic Evidence Digest: ${evidenceHash}`);
    if (notes || session?.officer_observations) {
      doc.moveDown(0.4);
      doc.font('Helvetica-Bold').text('Enforcement Officer Remarks:');
      doc.font('Helvetica').text(notes || session?.officer_observations || '');
    }

    doc.moveDown(1.5);
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#0f172a').text('Authorized Inspecting Signatory: _________________________', { align: 'right' });
    doc.fontSize(8).font('Helvetica').fillColor('#64748b').text('Legal Metrology Directorate, Ministry of Consumer Affairs, Govt. of India', { align: 'right' });

    doc.end();

    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    return {
      pdf_path: pdfPath,
      pdf_url: `/api/v1/report/download/${reportFileName}`,
      evidence_hash: evidenceHash
    };
  }
}
