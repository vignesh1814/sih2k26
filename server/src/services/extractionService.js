/**
 * Information Extraction Service for LMPC Compliance
 * Strictly extracts statutory declarations according to the Legal Metrology (Packaged Commodities) Rules, 2011.
 * Explicitly treats all 'Rs.', 'rs.', 'Rs', 'rs', '₹', 'INR', 'Price: Rs', 'MRP' declarations as MRP.
 */
export class ExtractionService {
  /**
   * Extract declarations from OCR detected items or raw text
   * @param {Array<{text: string, x_min?: number, y_min?: number, x_max?: number, y_max?: number, confidence?: number}>} detections 
   */
  static extractDeclarations(detections = []) {
    const fullText = detections.map(d => d.text).join('\n');
    return this.extractFromText(fullText, detections);
  }

  /**
   * Deterministic semantic heuristic extraction
   * @param {string} fullText 
   * @param {Array} detections 
   */
  static extractFromText(fullText, detections = []) {
    const decl = {
      generic_name: null,
      net_quantity: null,
      unit: null,
      mrp: null,
      mrp_text: null,
      has_inclusive_phrase: false,
      unit_sale_price: null,
      mfg_date: null,
      expiry_date: null,
      manufacturer: null,
      country_of_origin: 'India',
      consumer_care: null,
      barcode: null
    };

    if (!fullText) return decl;

    // 1. Generic / Commodity Name
    const nameMatch = fullText.match(/(?:Generic\s*Name|Name\s*of\s*Commodity|Product\s*Name)\s*[:\-]?\s*([^\n\r]+)/i);
    if (nameMatch) {
      decl.generic_name = nameMatch[1].trim();
    } else if (detections.length > 0) {
      for (const d of detections) {
        const t = d.text.trim();
        if (t && !/(MRP|M\.R\.P|Net|Qty|Mfg|Date|Mfd|Rs|rs|₹|INR|\d{13})/i.test(t) && t.length > 2) {
          decl.generic_name = t;
          break;
        }
      }
    }

    // 2. Net Quantity & Statutory Unit (e.g. 500 g, 1 kg, 200 ml, 1 L, 10 N)
    const qtyMatch = fullText.match(/(?:Net\s*Quantity|Net\s*Qty|Net\s*Weight|Net\s*Vol|Net\s*Content|Weight)\s*[:\-.]?\s*(\d+(?:\.\d+)?)\s*([a-zA-Z.]+)/i);
    if (qtyMatch) {
      decl.net_quantity = qtyMatch[1];
      decl.unit = qtyMatch[2].trim();
    } else {
      const standaloneQty = fullText.match(/\b(\d+(?:\.\d+)?)\s*(gms|gm|kgs|kg|g|ml|l|ltrs|ltr|L|mL|pieces|pcs|N|U)\b/i);
      if (standaloneQty) {
        decl.net_quantity = standaloneQty[1];
        decl.unit = standaloneQty[2].trim();
      }
    }

    // 3. MRP (Maximum Retail Price) & Treatment of Rs / rs / ₹ / INR as MRP
    let mrpVal = null;

    // Pattern A: Explicit MRP (MRP, M.R.P., Max Retail Price, Retail Price)
    const explicitMrp = fullText.match(/(?:MRP|M\.R\.P|Maximum\s*Retail\s*Price|Max\s*Retail\s*Price|Retail\s*Price)\s*[:\-.]?\s*(?:Rs\.?|rs\.?|INR|[₹\u20B9])?\s*(\d+(?:\.\d+)?)/i);
    
    // Pattern B: Explicit Rs / rs / ₹ / INR representation (e.g. Rs. 50/-, Rs 50.00, ₹ 99, rs. 120, Price: Rs 45)
    const rsMrp = fullText.match(/(?:(?:Rs\.?|rs\.?|[₹\u20B9]|INR)|(?:Price\s*[:\-]?\s*(?:Rs\.?|rs\.?|[₹\u20B9]|INR)?))\s*(\d+(?:\.\d+)?)(?:\s*\/\-)?/i);

    if (explicitMrp) {
      mrpVal = parseFloat(explicitMrp[1]);
    } else if (rsMrp) {
      mrpVal = parseFloat(rsMrp[1]);
    }

    if (mrpVal !== null && !isNaN(mrpVal)) {
      decl.mrp = mrpVal;
    }

    // Find whole price line to check for "incl. of all taxes"
    const mrpLineMatch = fullText.match(/(?:(?:MRP|M\.R\.P|Maximum\s*Retail\s*Price)[^\n\r]+|(?:Rs\.?|rs\.?|[₹\u20B9]|INR)\s*\d+(?:\.\d+)?[^\n\r]*)/i);
    const taxPattern = /(?:incl\.?|inclusive)\s*(?:of)?\s*all\s*taxes/i;

    if (mrpLineMatch) {
      decl.mrp_text = mrpLineMatch[0].trim();
      decl.has_inclusive_phrase = taxPattern.test(decl.mrp_text) || taxPattern.test(fullText);
    } else {
      decl.has_inclusive_phrase = taxPattern.test(fullText);
      if (decl.mrp !== null) {
        decl.mrp_text = `₹ ${decl.mrp}${decl.has_inclusive_phrase ? ' (Incl. of all taxes)' : ''}`;
      }
    }

    // 4. Unit Sale Price (USP) under Rule 6(11) (e.g. USP Rs. 0.20/g, Rs 50/kg)
    const uspMatch = fullText.match(/(?:Unit\s*Sale\s*Price|USP)\s*[:\-.]?\s*(?:Rs\.?|rs\.?|INR|[₹\u20B9])?\s*(\d+(?:\.\d+)?)\s*(?:per|\/)\s*([a-zA-Z]+)/i);
    if (uspMatch) {
      const parsedUsp = parseFloat(uspMatch[1]);
      if (!isNaN(parsedUsp)) decl.unit_sale_price = parsedUsp;
    }

    // 5. Date of Manufacture / Packaging (e.g. 05/2024, May 2024, 12-2023, PKD 08/24)
    const dateMatch = fullText.match(/(?:Mfg|Date\s*of\s*Mfg|Manufactured|PKD|Packed|Mfd|Pkg\s*Date)\s*[:\-.]?\s*(\d{1,2}[\/\-]\d{2,4}|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s\-]\d{2,4}\b)/i);
    if (dateMatch) {
      decl.mfg_date = dateMatch[1].trim();
    } else {
      const genericDate = fullText.match(/\b(0[1-9]|1[0-2])[\/\-](20\d{2})\b/);
      if (genericDate) {
        decl.mfg_date = genericDate[0];
      }
    }

    // Expiry / Best Before date
    const expMatch = fullText.match(/(?:Expiry|Exp\s*Date|Best\s*Before|Use\s*by)\s*[:\-.]?\s*(\d{1,2}[\/\-]\d{2,4}|\d+\s*(?:months|days|years)[^\n\r]*)/i);
    if (expMatch) {
      decl.expiry_date = expMatch[1].trim();
    }

    // 6. Manufacturer / Packer Details
    const mfdMatch = fullText.match(/(?:Mfd\s*by|Manufactured\s*by|Packer|Packed\s*by|Marketed\s*by|Mfg\s*by)\s*[:\-.]?\s*([^\n\r]+(?:\n[^\n\r]+)?)/i);
    if (mfdMatch) {
      decl.manufacturer = mfdMatch[1].replace(/\n/g, ', ').trim();
    }

    // 7. Customer / Consumer Care Helpline & Email
    const careContacts = [];
    const tollFree = fullText.match(/\b(1800[-\s]?\d{2,3}[-\s]?\d{3,4}|\b1800\d{6,7}\b)\b/);
    if (tollFree) {
      careContacts.push(`Toll Free: ${tollFree[1].trim()}`);
    }

    const email = fullText.match(/\b([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,})\b/);
    if (email) {
      careContacts.push(`Email: ${email[1].trim()}`);
    }

    const careHeader = fullText.match(/(?:Consumer\s*Care|Customer\s*Care|Helpline|Grievance\s*Cell|Feedback)\s*[:\-.]?\s*([^\n\r]+)/i);
    if (careHeader && careContacts.length === 0) {
      careContacts.push(careHeader[1].trim());
    }

    if (careContacts.length > 0) {
      decl.consumer_care = careContacts.join(' | ');
    } else {
      const genPhone = fullText.match(/\b(?:Tel|Phone|Mob|Contact)?\s*[:\-.]?\s*(\+91[-\s]?\d{10}|\b[6-9]\d{9}\b)/i);
      if (genPhone) {
        decl.consumer_care = `Phone: ${genPhone[1].trim()}`;
      }
    }

    // 8. Barcode (EAN-13 or UPC-A)
    const barcodeMatch = fullText.match(/\b(\d{13}|\d{12})\b/);
    if (barcodeMatch) {
      decl.barcode = barcodeMatch[1];
    }

    return decl;
  }
}
