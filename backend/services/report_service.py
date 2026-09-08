import os
import time
from typing import List
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from backend.models.schemas import ExtractedDeclarations, RuleViolation
from auxiliary_modules.legal_notice_generator import LegalNoticeGenerator

class ReportService:
    @staticmethod
    def generate_pdf(
        scan_id: str,
        image_path: str,
        status: str,
        decl: ExtractedDeclarations,
        violations: List[RuleViolation],
        evidence_hash: str,
        output_pdf_path: str
    ) -> str:
        os.makedirs(os.path.dirname(output_pdf_path), exist_ok=True)
        c = canvas.Canvas(output_pdf_path, pagesize=letter)
        
        # Header
        c.setFillColor(colors.HexColor("#1A365D"))
        c.rect(0, 740, 612, 52, fill=True, stroke=False)
        c.setFillColor(colors.white)
        c.setFont("Helvetica-Bold", 14)
        c.drawString(40, 765, "GOVERNMENT OF INDIA - LEGAL METROLOGY DIVISION")
        c.setFont("Helvetica", 9)
        c.drawString(40, 748, "DIGITAL COMPLIANCE INSPECTION MEMO & PRELIMINARY CHALLAN")

        # Meta line
        c.setFillColor(colors.black)
        c.setFont("Helvetica-Bold", 9)
        c.drawString(40, 720, f"Scan ID: {scan_id}")
        c.setFont("Helvetica", 9)
        c.drawString(250, 720, f"Date: {time.strftime('%Y-%m-%d %H:%M:%S')}")
        c.drawString(400, 720, f"Status: {status}")

        # Evidence Hash
        c.setFont("Helvetica", 7)
        c.setFillColor(colors.HexColor("#4A5568"))
        c.drawString(40, 705, f"Cryptographic Evidence Hash (SHA-256): {evidence_hash}")
        c.line(40, 695, 572, 695)

        # Subject Commodity
        c.setFillColor(colors.black)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(40, 675, "1. Subject Commodity Details:")
        c.setFont("Helvetica", 9)
        c.drawString(50, 655, f"Commodity Name: {decl.generic_name or 'N/A'}")
        c.drawString(50, 640, f"Net Quantity: {decl.net_quantity or 'N/A'} {decl.unit or ''}")
        c.drawString(50, 625, f"Declared MRP: Rs. {decl.mrp if decl.mrp is not None else 'N/A'} ({'Inclusive' if decl.has_inclusive_phrase else 'Non-compliant'})")
        c.drawString(50, 610, f"Mfg Date: {decl.mfg_date or 'N/A'}")
        c.drawString(50, 595, f"Manufacturer: {decl.manufacturer or 'N/A'}")
        c.drawString(50, 580, f"Barcode: {decl.barcode or 'N/A'}")

        # Compliance Findings
        c.setFont("Helvetica-Bold", 11)
        c.drawString(40, 550, "2. Legal Metrology Statutory Audit Findings:")

        y = 530
        if not violations:
            c.setFont("Helvetica-Bold", 10)
            c.setFillColor(colors.HexColor("#2E7D32"))
            c.drawString(50, y, "[PASS] No statutory violations observed under LMPC Rules, 2011.")
            y -= 25
        else:
            for v in violations:
                c.setFont("Helvetica-Bold", 9)
                c.setFillColor(colors.HexColor("#C53030") if v.severity == "CRITICAL" else colors.HexColor("#DD6B20"))
                c.drawString(50, y, f"[{v.severity}] {v.rule_code} — {v.declaration}")
                y -= 14
                c.setFont("Helvetica", 8)
                c.setFillColor(colors.black)
                c.drawString(60, y, f"Reason: {v.reason}")
                y -= 12
                if v.suggested_correction:
                    c.drawString(60, y, f"Correction: {v.suggested_correction}")
                    y -= 14
                else:
                    y -= 6

                if y < 150:
                    break

        # Legal Notice & Penalties
        c.line(40, y, 572, y)
        y -= 18
        c.setFont("Helvetica-Bold", 10)
        c.drawString(40, y, "3. Statutory Notice under Section 36(1) of Legal Metrology Act, 2009:")
        y -= 14
        c.setFont("Helvetica", 8)
        notice_text = (
            "Whoever manufactures, packs, imports, sells, distributes, delivers, or offers for sale any pre-packaged "
            "commodity which does not conform to the declarations under LMPC Rules, 2011, shall be punishable with fine "
            "which may extend to twenty-five thousand rupees for the first offence under Section 36(1)."
        )
        c.drawString(40, y, notice_text[:110])
        y -= 10
        c.drawString(40, y, notice_text[110:])

        # Officer signature block
        y -= 40
        c.setFont("Helvetica-Bold", 9)
        c.drawString(400, y, "Inspecting Authority:")
        y -= 12
        c.setFont("Helvetica", 8)
        c.drawString(400, y, "Digitally Verified by LMPC Edge AI")
        c.drawString(400, y - 10, "Legal Metrology Enforcement Directorate")

        c.save()
        return output_pdf_path
