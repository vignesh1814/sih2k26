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

        # 4. Unit Sale Price (USP)
        m_usp = re.search(r'(?:Unit\s*Sale\s*Price|USP)\s*[:\-.]?\s*(?:Rs\.?|INR|\u20b9)?\s*(\d+(?:\.\d+)?)\s*(?:per|\/)\s*([a-zA-Z]+)', full_text, re.I)
        if m_usp:
            try:
                decl.unit_sale_price = float(m_usp.group(1))
            except Exception:
                pass

        # 5. Mfg Date
        m_date = re.search(r'(?:Mfg|Date\s*of\s*Mfg|Manufactured|PKD|Packed)\s*[:\-.]?\s*(\d{1,2}[\/\-]\d{2,4}|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s\-]\d{2,4}\b)', full_text, re.I)
        if m_date:
            decl.mfg_date = m_date.group(1).strip()
        else:
            m_generic_date = re.search(r'\b(0[1-9]|1[0-2])[\/\-](20\d{2})\b', full_text)
            if m_generic_date:
                decl.mfg_date = m_generic_date.group(0)

        # 6. Manufacturer
        m_mfd = re.search(r'(?:Mfd\s*by|Manufactured\s*by|Packer|Packed\s*by|Marketed\s*by)\s*[:\-.]?\s*([^\n\r]+(?:\n[^\n\r]+)?)', full_text, re.I)
        if m_mfd:
            decl.manufacturer = m_mfd.group(1).replace("\n", ", ").strip()

        # 7. Customer Care (Toll Free No, Helpline, Phone, Email)
        care_contacts = []
        # Toll-Free pattern (e.g. 1800 22 7700, 1800-180-1234, 18001801234, 1800 11 2233)
        m_tollfree = re.search(r'\b(1800[-\s]?\d{2,3}[-\s]?\d{3,4}|\b1800\d{6,7}\b)\b', full_text)
        if m_tollfree:
            care_contacts.append(f"Toll Free: {m_tollfree.group(1).strip()}")

        # Email address pattern (e.g. customercare@parle.biz, feedback@tataconsumer.com)
        m_email = re.search(r'\b([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,})\b', full_text)
        if m_email:
            care_contacts.append(f"Email: {m_email.group(1).strip()}")

        # Explicit Customer / Consumer Care headers
        m_care_header = re.search(r'(?:Consumer\s*Care|Customer\s*Care|Helpline|Grievance\s*Cell|Feedback)\s*[:\-.]?\s*([^\n\r]+)', full_text, re.I)
        if m_care_header and not care_contacts:
            care_contacts.append(m_care_header.group(1).strip())

        if care_contacts:
            decl.consumer_care = " | ".join(care_contacts)
        else:
            # General phone fallback
            m_gen_phone = re.search(r'\b(?:Tel|Phone|Mob)?\s*[:\-.]?\s*(\+91[-\s]?\d{10}|\b\d{10}\b)', full_text, re.I)
            if m_gen_phone:
                decl.consumer_care = f"Phone: {m_gen_phone.group(1).strip()}"

        # 8. Barcode (EAN-13 or UPC)
        m_bar = re.search(r'\b(\d{13}|\d{12})\b', full_text)
        if m_bar:
            decl.barcode = m_bar.group(1)

        return decl
