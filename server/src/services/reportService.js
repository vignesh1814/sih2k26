import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const reportsDir = path.resolve(__dirname, '..', '..', 'reports');

export class ReportService {
  /**
   * Generates a formal LMPC statutory inspection PDF report.
   * @param {Object} params
   * @returns {Promise<{ pdf_path: string, pdf_url: string, evidence_hash: string }>}
   */
  static async generateReport({ scanId, scanData, officerName = 'Legal Metrology Officer', station = 'Central Directorate', notes = '' }) {
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const reportFileName = `LMPC_Inspection_${scanId.slice(0, 8)}_${Date.now()}.pdf`;
    const pdfPath = path.join(reportsDir, reportFileName);

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const writeStream = fs.createWriteStream(pdfPath);
    doc.pipe(writeStream);

    // Header & Emblem
    doc.fontSize(18).font('Helvetica-Bold').fillColor('#1e3a8a').text('GOVERNMENT OF INDIA', { align: 'center' });
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#1e293b').text('MINISTRY OF CONSUMER AFFAIRS, FOOD & PUBLIC DISTRIBUTION', { align: 'center' });
    doc.fontSize(12).font('Helvetica').fillColor('#475569').text('DEPARTMENT OF CONSUMER AFFAIRS - LEGAL METROLOGY DIVISION', { align: 'center' });
    doc.moveDown(0.5);

    doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#2563eb').lineWidth(2).stroke();
    doc.moveDown(0.5);

    // Title
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#0f172a').text('STATUTORY COMPLIANCE INSPECTION REPORT', { align: 'center' });
    doc.fontSize(10).font('Helvetica-Oblique').fillColor('#64748b').text('Under the Legal Metrology Act, 2009 & Packaged Commodities Rules, 2011', { align: 'center' });
    doc.moveDown(1);

    // Metadata Table
    const dateStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e293b');
    doc.text(`Scan Reference ID: `, { continued: true }).font('Helvetica').text(scanId);
    doc.font('Helvetica-Bold').text(`Inspection Date: `, { continued: true }).font('Helvetica').text(`${dateStr} IST`);
    doc.font('Helvetica-Bold').text(`Inspecting Officer: `, { continued: true }).font('Helvetica').text(officerName);
    doc.font('Helvetica-Bold').text(`Station / Wing: `, { continued: true }).font('Helvetica').text(station);
    
    // Status Badge
    const status = scanData?.status || 'PASS';
    const statusColor = status === 'PASS' ? '#16a34a' : status === 'FAIL' ? '#dc2626' : '#d97706';
    doc.font('Helvetica-Bold').text(`Audit Verdict: `, { continued: true }).fillColor(statusColor).text(`[ ${status} ]`);
    doc.moveDown(1);

    // Section 1: Declarations Found
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#1e3a8a').text('1. Extracted Statutory Declarations (Rule 6)');
    doc.fontSize(9).font('Helvetica').fillColor('#334155');
    
    const decl = scanData?.declarations || {};
    const declItems = [
      ['Generic Name of Commodity (Rule 6(1)(b))', decl.generic_name || 'NOT DETECTED'],
      ['Net Quantity & Unit (Rule 6(1)(c))', decl.net_quantity && decl.unit ? `${decl.net_quantity} ${decl.unit}` : 'NOT DETECTED'],
      ['Maximum Retail Price (MRP / Rs.) (Rule 6(1)(e))', decl.mrp ? `Rs. ${decl.mrp} ${decl.has_inclusive_phrase ? '(Incl. of all taxes)' : '(Taxes unstated)'}` : 'NOT DETECTED'],
      ['Unit Sale Price (USP) (Rule 6(11))', decl.unit_sale_price ? `Rs. ${decl.unit_sale_price}` : (decl.mrp && decl.net_quantity ? 'Calculated automatically' : 'N/A')],
      ['Date of Manufacture / Packing (Rule 6(1)(d))', decl.mfg_date || 'NOT DETECTED'],
      ['Manufacturer / Packer (Rule 6(1)(a))', decl.manufacturer || 'NOT DETECTED'],
      ['Consumer Care Grievance Cell (Rule 6(2))', decl.consumer_care || 'NOT DETECTED'],
      ['Country of Origin', decl.country_of_origin || 'India'],
      ['GS1 Barcode (Rule 6(1)(aa))', decl.barcode || 'N/A']
    ];

    declItems.forEach(([label, val]) => {
      doc.font('Helvetica-Bold').text(`• ${label}: `, { continued: true }).font('Helvetica').text(val);
    });
    doc.moveDown(1);

    // Section 2: Statutory Violations
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#1e3a8a').text('2. Rule Violations & Non-Compliance Findings');
    const violations = scanData?.violations || [];
    if (violations.length === 0) {
      doc.fontSize(10).font('Helvetica').fillColor('#16a34a').text('✔ All mandatory statutory declarations strictly conform to LMPC Rules 2011.');
    } else {
      violations.forEach((v, idx) => {
        doc.fontSize(10).font('Helvetica-Bold').fillColor(v.severity === 'CRITICAL' ? '#b91c1c' : '#d97706');
        doc.text(`${idx + 1}. [${v.severity}] ${v.rule_code} - ${v.declaration}`);
        doc.fontSize(9).font('Helvetica').fillColor('#334155');
        doc.text(`   Finding: ${v.reason}`);
        if (v.suggested_correction) {
          doc.text(`   Remedial Action: ${v.suggested_correction}`);
        }
      });
    }
    doc.moveDown(1);

    // Section 3: Evidence Integrity & Officer Notes
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#1e3a8a').text('3. Chain of Custody & Evidence Hash');
    const evidenceHash = scanData?.evidence_hash || crypto.createHash('sha256').update(scanId).digest('hex');
    doc.fontSize(9).font('Helvetica').fillColor('#334155');
    doc.text(`SHA-256 Cryptographic Evidence Digest: ${evidenceHash}`);
    if (notes) {
      doc.moveDown(0.5);
      doc.font('Helvetica-Bold').text('Enforcement Officer Remarks:');
      doc.font('Helvetica').text(notes);
    }

    doc.moveDown(2);
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#0f172a').text('Authorized Signatory: _________________________', { align: 'right' });
    doc.fontSize(8).font('Helvetica').fillColor('#64748b').text('Legal Metrology Directorate, Ministry of Consumer Affairs', { align: 'right' });

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
