import os
import json
import re
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
from backend.models.schemas import ExtractedDeclarations

# Automatically load environment variables (.env)
load_dotenv()

class ExtractionService:
    def __init__(self, gemini_api_key: Optional[str] = None):
        self.api_key = gemini_api_key or os.getenv("GEMINI_API_KEY")
        self.client = None
        if self.api_key:
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
                print("[INFO] Gemini 3.6 client successfully initialized.")
            except Exception as e:
                print(f"[WARN] Gemini client init error: {e}")

    def extract_declarations(self, ocr_detections: List[Dict[str, Any]]) -> ExtractedDeclarations:
        """
        Extracts structured LMPC Rule 6 declarations from OCR lines.
        Runs deterministic semantic regex & layout heuristics instantly in <5ms.
        """
        full_text = "\n".join([d["text"] for d in ocr_detections])
        return self._extract_heuristically(ocr_detections, full_text)

    def _extract_with_gemini(self, ocr_text: str) -> ExtractedDeclarations:
        prompt = f"""You are an expert Legal Metrology (LMPC) compliance auditor in India.
Analyze the following OCR text extracted from a packaged commodity label.
Extract the statutory declarations strictly according to Legal Metrology (Packaged Commodities) Rules, 2011.

OCR Text:
\"\"\"
{ocr_text}
\"\"\"

Return a valid JSON object matching these exact fields:
- generic_name: string or null (common/generic name of commodity)
- net_quantity: string or null (numeric portion of quantity, e.g. "500", "1")
- unit: string or null (unit symbol, e.g. "g", "kg", "gms", "ml", "L")
- mrp: number or null (numeric price value)
- mrp_text: string or null (raw price line string)
- has_inclusive_phrase: boolean or null (true if contains 'inclusive of all taxes' or similar)
- unit_sale_price: number or null (unit sale price value if printed)
- mfg_date: string or null (manufacturing date e.g. MM/YYYY or DD/MM/YYYY)
- expiry_date: string or null
- manufacturer: string or null (full manufacturer or packer name and registered address)
- country_of_origin: string or null
- consumer_care: string or null (helpline phone, email or address)
- barcode: string or null (if 12 or 13 digit number)
"""
        response = self.client.models.generate_content(
            model='gemini-3.6-flash',
            contents=prompt,
            config={'response_mime_type': 'application/json'}
        )
        data = json.loads(response.text)
        return ExtractedDeclarations(**data)

    def _extract_heuristically(self, detections: List[Dict[str, Any]], full_text: str) -> ExtractedDeclarations:
        decl = ExtractedDeclarations()
        
        # 1. Generic Name
        m_name = re.search(r'(?:Generic\s*Name|Name\s*of\s*Commodity|Product)\s*[:\-]?\s*([^\n\r]+)', full_text, re.I)
        if m_name:
            decl.generic_name = m_name.group(1).strip()
        elif detections:
            first_line = detections[0]["text"]
            if not re.search(r'(MRP|Net|Mfg|Date|Mfd)', first_line, re.I):
                decl.generic_name = first_line.strip()

        # 2. Net Quantity & Unit
        m_qty = re.search(r'(?:Net\s*Quantity|Net\s*Qty|Net\s*Weight|Net\s*Vol|Net\s*Content|Weight)\s*[:\-.]?\s*(\d+(?:\.\d+)?)\s*([a-zA-Z.]+)', full_text, re.I)
        if m_qty:
            decl.net_quantity = m_qty.group(1)
            decl.unit = m_qty.group(2).strip()
        else:
            m_standalone_qty = re.search(r'\b(\d+(?:\.\d+)?)\s*(gms|gm|kgs|kg|g|ml|l|ltrs|ltr|L|mL)\b', full_text, re.I)
            if m_standalone_qty:
                decl.net_quantity = m_standalone_qty.group(1)
                decl.unit = m_standalone_qty.group(2).strip()

        # 3. MRP & Inclusive Phrase (handles MRP, M.R.P., Rs., rs., Rs, rs, ₹, INR + value)
        m_mrp = re.search(r'(?:MRP|M\.R\.P|Maximum\s*Retail\s*Price)\s*[:\-.]?\s*(?:Rs\.?|INR|\u20b9)?\s*(\d+(?:\.\d+)?)', full_text, re.I)
        if not m_mrp:
            # Match formats like: Rs. 100, Rs.100, rs. 50, rs50, Rs 50, rs.20/-
            m_mrp = re.search(r'\b(?:Rs\.?|rs\.?|\u20b9|INR)\s*(\d+(?:\.\d+)?)(?:\s*\/\-)?\b', full_text, re.I)

        if m_mrp:
            try:
                decl.mrp = float(m_mrp.group(1))
            except Exception:
                pass
            
        m_mrp_line = re.search(r'(?:(?:MRP|M\.R\.P|Maximum\s*Retail\s*Price)[^\n\r]+|\b(?:Rs\.?|rs\.?|\u20b9|INR)\s*\d+(?:\.\d+)?[^\n\r]*)', full_text, re.I)
        tax_pattern = r'(?:incl\.?|inclusive)\s*(?:of)?\s*all\s*taxes'
        if m_mrp_line:
            decl.mrp_text = m_mrp_line.group(0).strip()
            decl.has_inclusive_phrase = bool(re.search(tax_pattern, decl.mrp_text, re.I))
        else:
            decl.has_inclusive_phrase = bool(re.search(tax_pattern, full_text, re.I))

        # 4. Unit Sale Price (USP) under Rule 6(11)
        # Matches patterns like "USP Rs. 1.03 / g", "1.03 / g", "1.03/g", "1.03 g", "Rs 1.03 per g", "₹ 1.03 / 100g", "1.03 / gm", "1.03 per gram"
        usp_val = None
        m_usp_explicit = re.search(r'(?:Unit\s*Sale\s*Price|USP|Unit\s*Price)\s*[:\-.]?\s*(?:Rs\.?|INR|\u20b9)?\s*(\d+(?:\.\d+)?)\s*(?:\/|\s*per\s*|\s+)?\s*([a-zA-Z0-9]+)?', full_text, re.I)
        m_usp_slash = re.search(r'(?:(?:Rs\.?|rs\.?|\u20b9|INR)\s*)?(\d+(?:\.\d+)?)\s*(?:\/|\s*per\s*)\s*(?:100g|100ml|10g|g|gm|gms|gram|grams|kg|kgs|ml|l|ltr|ltrs|L|mL|N|count|piece|pcs|unit)\b', full_text, re.I)
        m_usp_decimal = re.search(r'(?:(?:Rs\.?|rs\.?|\u20b9|INR)\s*)?(\d+\.\d{1,4})\s*(?:g|gm|gms|ml|l|kg|N)\b', full_text, re.I)

        if m_usp_explicit and m_usp_explicit.group(1):
            try:
                usp_val = float(m_usp_explicit.group(1))
            except Exception:
                pass
        elif m_usp_slash and m_usp_slash.group(1):
            try:
                usp_val = float(m_usp_slash.group(1))
            except Exception:
                pass
        elif m_usp_decimal and m_usp_decimal.group(1):
            try:
                parsed = float(m_usp_decimal.group(1))
                net_qty_val = float(decl.net_quantity) if decl.net_quantity else None
                if net_qty_val is None or abs(net_qty_val - parsed) > 0.01:
                    usp_val = parsed
            except Exception:
                pass

        if usp_val is not None:
            decl.unit_sale_price = round(usp_val, 2)

        # 5. Mfg Date - match standard patterns, mm/yyyy, mm/yy or any standalone year (2018-2035)
        m_date = re.search(r'(?:Mfg|Date\s*of\s*Mfg|Manufactured|PKD|Packed|Mfd|Pkg\s*Date|Batch|DOM|Date|Year|Yr)\s*[:\-.]?\s*(\d{1,2}[\/\-]\d{2,4}|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s\-]\d{2,4}\b|\b20[123]\d\b)', full_text, re.I)
        if m_date:
            decl.mfg_date = m_date.group(1).strip()
        else:
            m_generic_date = re.search(r'\b(0[1-9]|1[0-2])[\/\-](20\d{2}|\d{2})\b', full_text)
            if m_generic_date:
                decl.mfg_date = m_generic_date.group(0)
            else:
                m_standalone_year = re.search(r'\b(201[8-9]|202[0-9]|203[0-5])\b', full_text)
                if m_standalone_year:
                    decl.mfg_date = m_standalone_year.group(0)
                else:
                    m_short_year = re.search(r"'(2[0-9])\b", full_text)
                    if m_short_year:
                        decl.mfg_date = f"20{m_short_year.group(1)}"

        # 6. Manufacturer
        m_mfd = re.search(r'(?:Mfd\s*by|Manufactured\s*by|Packer|Packed\s*by|Marketed\s*by)\s*[:\-.]?\s*([^\n\r]+(?:\n[^\n\r]+)?)', full_text, re.I)
        if m_mfd:
            decl.manufacturer = m_mfd.group(1).replace("\n", ", ").strip()

        # 7. Customer / Consumer Care Helpline, Phone & Email
        # ANY email address OR ANY phone number / mobile number sequence is considered Customer Care
        care_contacts = []
        
        # (A) Any Email Address
        m_email = re.findall(r'\b([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,})\b', full_text)
        for em in m_email:
            care_contacts.append(f"Email: {em.strip()}")

        # (B) Toll-Free pattern (e.g. 1800 22 7700, 1800-180-1234, 18001801234, 1800 11 2233)
        m_tollfree = re.search(r'\b(1800[-\s]?\d{2,3}[-\s]?\d{3,4}|\b1800\d{6,7}\b)\b', full_text)
        if m_tollfree:
            care_contacts.append(f"Toll Free: {m_tollfree.group(1).strip()}")

        # (C) Explicit Consumer Care Header
        m_care_header = re.search(r'(?:Consumer\s*Care|Customer\s*Care|Helpline|Grievance\s*Cell|Feedback|Customer\s*Support|Queries\s*&?\s*Feedback|Contact\s*Us)\s*[:\-.]?\s*([^\n\r]+)', full_text, re.I)
        if m_care_header:
            hdr_str = m_care_header.group(1).strip()
            if not any(hdr_str.lower() in c.lower() for c in care_contacts):
                care_contacts.append(hdr_str)

        # (D) Any standard phone/mobile number (Mobile +91 / 10-digit, Landline with STD code, e.g. 022-27894500, +91 9876543210, 9876543210)
        phone_pattern = r'(?:(?:Tel|Phone|Mob|Mobile|Contact|Call|Helpline|No|Ph)\s*[:\-.]?\s*)?(\+91[-\s]?[6-9]\d{9}|\b0\d{2,4}[-\s]?\d{6,8}\b|\b[6-9]\d{9}\b|\b\d{3,4}[-\s]?\d{6,8}\b)'
        m_phone = re.search(phone_pattern, full_text, re.I)
        if m_phone and m_phone.group(1):
            p_str = m_phone.group(1).strip()
            if not decl.barcode or p_str not in decl.barcode:
                if not any(p_str in c for c in care_contacts):
                    care_contacts.append(f"Phone: {p_str}")

        # (E) Fallback: Any standalone 10-digit or 11-digit number sequence in text
        if not care_contacts:
            m_fallback = re.search(r'\b([6-9]\d{9}|0\d{10})\b', full_text)
            if m_fallback and m_fallback.group(1):
                num_str = m_fallback.group(1).strip()
                if not decl.barcode or num_str not in decl.barcode:
                    care_contacts.append(f"Contact: {num_str}")

        if care_contacts:
            decl.consumer_care = " | ".join(care_contacts)

        # 8. Barcode (EAN-13 or UPC)
        m_bar = re.search(r'\b(\d{13}|\d{12})\b', full_text)
        if m_bar:
            decl.barcode = m_bar.group(1)

        return decl
