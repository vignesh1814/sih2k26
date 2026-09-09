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
    if (typeof detections === 'string') {
      return this.extractFromText(detections, [{ text: detections }]);
    }
    const fullText = Array.isArray(detections) ? detections.map(d => (typeof d === 'string' ? d : d.text || '')).join('\n') : '';
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

    // 4. Unit Sale Price (USP) under Rule 6(11)
    // Anything in 'g' or '/g' or 'per g' or explicit USP is captured as Unit Sale Price
    let uspVal = null;
    
    // Pattern A: Explicit USP / Unit Sale Price header
    const explicitUsp = fullText.match(/(?:Unit\s*Sale\s*Price|USP|Unit\s*Price)\s*[:\-.]?\s*(?:Rs\.?|rs\.?|INR|[₹\u20B9])?\s*(\d+(?:\.\d+)?)\s*(?:\/|\s*per\s*|\s+)?\s*([a-zA-Z0-9]+)?/i);
    
    // Pattern B: Slash or Per unit rate (e.g. 1.03 / g, 1.03/g, Rs. 1.03 / g, ₹ 1.03 / gm, 1.03 per g, 1.03/100g, 1.03/10g)
    const slashUsp = fullText.match(/(?:(?:Rs\.?|rs\.?|[₹\u20B9]|INR)\s*)?(\d+(?:\.\d+)?)\s*(?:\/|\s*per\s*)\s*(?:100g|100ml|10g|g|gm|gms|gram|grams|kg|kgs|ml|l|ltr|ltrs|L|mL|N|count|piece|pcs|unit)\b/i);

    // Pattern C: Any value with 'g' (e.g. 1.03 g, 1.03g, 0.90 g, Rs 1.03 g) when distinct from total net quantity
    const anyGPattern = fullText.match(/(?:(?:Rs\.?|rs\.?|[₹\u20B9]|INR|USP)?\s*)?(\d+(?:\.\d+)?)\s*(?:g|gm|gms|gram|grams)\b/i);

    // Pattern D: Decimal number followed by unit (e.g., 1.03 g or 1.03g or Rs. 1.03 g)
    const perUnitDecimal = fullText.match(/(?:(?:Rs\.?|rs\.?|[₹\u20B9]|INR)\s*)?(\d+\.\d{1,4})\s*(?:g|gm|gms|ml|l|kg|N)\b/i);

    const netQtyVal = decl.net_quantity ? parseFloat(decl.net_quantity) : null;

    if (explicitUsp && explicitUsp[1]) {
      const parsed = parseFloat(explicitUsp[1]);
      if (!isNaN(parsed) && parsed > 0) uspVal = parsed;
    } else if (slashUsp && slashUsp[1]) {
      const parsed = parseFloat(slashUsp[1]);
      if (!isNaN(parsed) && parsed > 0) uspVal = parsed;
    } else if (anyGPattern && anyGPattern[1]) {
      const parsed = parseFloat(anyGPattern[1]);
      if (!isNaN(parsed) && parsed > 0 && (netQtyVal === null || Math.abs(netQtyVal - parsed) > 0.01)) {
        uspVal = parsed;
      }
    } else if (perUnitDecimal && perUnitDecimal[1]) {
      const parsed = parseFloat(perUnitDecimal[1]);
      if (!isNaN(parsed) && parsed > 0 && (netQtyVal === null || Math.abs(netQtyVal - parsed) > 0.01)) {
        uspVal = parsed;
      }
    }

    if (uspVal !== null) {
      decl.unit_sale_price = Math.round(uspVal * 100) / 100;
    } else if (decl.mrp && decl.net_quantity) {
      // Auto-compute default per-gram USP if not explicitly printed
      const nq = parseFloat(decl.net_quantity);
      if (!isNaN(nq) && nq > 0) {
        decl.unit_sale_price = Math.round((decl.mrp / nq) * 100) / 100;
      }
    }

    // 5. Date of Manufacture / Packaging (e.g. 05/2024, May 2024, 12-2023, PKD 08/24, or any year e.g. 2024, 2025, 2026, '24)
    const dateMatch = fullText.match(/(?:Mfg|Date\s*of\s*Mfg|Manufactured|PKD|Packed|Mfd|Pkg\s*Date|Batch|DOM|Date|Year|Yr)\s*[:\-.]?\s*(\d{1,2}[\/\-]\d{2,4}|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s\-]\d{2,4}\b|\b20[123]\d\b)/i);
    if (dateMatch) {
      decl.mfg_date = dateMatch[1].trim();
    } else {
      // Check for mm/yyyy or mm/yy (e.g. 05/2024, 05/24, 12-2025)
      const genericDate = fullText.match(/\b(0[1-9]|1[0-2])[\/\-](20\d{2}|\d{2})\b/);
      if (genericDate) {
        decl.mfg_date = genericDate[0];
      } else {
        // Any standalone 4-digit year (e.g. 2018 to 2035) on package is considered Month & Year of Mfg
        const standaloneYear = fullText.match(/\b(201[8-9]|202[0-9]|203[0-5])\b/);
        if (standaloneYear) {
          decl.mfg_date = standaloneYear[0];
        } else {
          // Check for 2-digit apostrophe year like '24 or '25
          const shortYear = fullText.match(/'(2[0-9])\b/);
          if (shortYear) {
            decl.mfg_date = `20${shortYear[1]}`;
          }
        }
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

    // 7. Customer / Consumer Care Helpline, Phone & Email
    // ANY email address OR ANY phone number / mobile number sequence is considered Customer Care
    const careContacts = [];
    
    // (A) Any Email Address (e.g. support@domain.com, care@company.in, info@..., user@example.org)
    const emailMatches = fullText.match(/\b([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/g);
    if (emailMatches && emailMatches.length > 0) {
      for (const em of emailMatches) {
        const cleanEm = em.trim();
        if (!careContacts.some(c => c.toLowerCase().includes(cleanEm.toLowerCase()))) {
          careContacts.push(`Email: ${cleanEm}`);
        }
      }
    }

    // (B) Toll Free numbers (e.g. 1800 22 7700, 1800-11-2233, 18001801234, 1800-xxx-xxxx)
    const tollFree = fullText.match(/\b(1800[-\s]?\d{2,3}[-\s]?\d{3,4}|\b1800\d{6,7}\b)\b/);
    if (tollFree) {
      careContacts.push(`Toll Free: ${tollFree[1].trim()}`);
    }

    // (C) Explicit Customer / Consumer Care Header
    const careHeader = fullText.match(/(?:Consumer\s*Care|Customer\s*Care|Helpline|Grievance\s*Cell|Feedback|Customer\s*Support|Queries\s*&?\s*Feedback|Contact\s*Us)\s*[:\-.]?\s*([^\n\r]+)/i);
    if (careHeader && !careContacts.some(c => c.toLowerCase().includes(careHeader[1].toLowerCase().trim()))) {
      careContacts.push(careHeader[1].trim());
    }

    // (D) Any standard phone/mobile number (Mobile +91 / 10-digit, Landline with STD code, e.g. 022-27894500, +91 9876543210, 9876543210)
    const phonePattern = /(?:(?:Tel|Phone|Mob|Mobile|Contact|Call|Helpline|No|Ph)\s*[:\-.]?\s*)?(\+91[-\s]?[6-9]\d{9}|\b0\d{2,4}[-\s]?\d{6,8}\b|\b[6-9]\d{9}\b|\b\d{3,4}[-\s]?\d{6,8}\b)/i;
    const phoneMatch = fullText.match(phonePattern);
    if (phoneMatch && phoneMatch[1]) {
      const pStr = phoneMatch[1].trim();
      if (!decl.barcode || !decl.barcode.includes(pStr)) {
        if (!careContacts.some(c => c.includes(pStr))) {
          careContacts.push(`Phone: ${pStr}`);
        }
      }
    }

    // (E) Fallback: Any standalone 10-digit or 11-digit number sequence in text is considered customer care contact
    if (careContacts.length === 0) {
      const fallbackNumber = fullText.match(/\b([6-9]\d{9}|0\d{10})\b/);
      if (fallbackNumber && fallbackNumber[1]) {
        const numStr = fallbackNumber[1].trim();
        if (!decl.barcode || !decl.barcode.includes(numStr)) {
          careContacts.push(`Contact: ${numStr}`);
        }
      }
    }

    if (careContacts.length > 0) {
      decl.consumer_care = careContacts.join(' | ');
    }

    // 8. Country of Origin (mandatory for imports and domestic)
    const originMatch = fullText.match(/(?:Country\s*of\s*Origin|Made\s*in|Product\s*of|Origin)\s*[:\-.]?\s*([a-zA-Z\s]+)/i);
    if (originMatch) {
      decl.country_of_origin = originMatch[1].trim();
    } else if (/(?:India|Bharat)\b/i.test(fullText)) {
      decl.country_of_origin = 'India';
    }

    // 8. Barcode (EAN-13 or UPC-A)
    const barcodeMatch = fullText.match(/\b(\d{13}|\d{12})\b/);
    if (barcodeMatch) {
      decl.barcode = barcodeMatch[1];
    }

    return decl;
  }
}
