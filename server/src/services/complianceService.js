/**
 * Statutory LMPC Compliance Engine
 * Enforces Legal Metrology (Packaged Commodities) Rules, 2011 and Amendments.
 */
export class ComplianceService {
  /**
   * Evaluates declarations against statutory requirements.
   * @param {Object} decl - Extracted declarations
   * @returns {{ status: 'PASS'|'FAIL'|'NEEDS_REVIEW'|'INSUFFICIENT_EVIDENCE', violations: Array }}
   */
  static evaluateCompliance(decl = {}) {
    const violations = [];

    // 1. Rule 26 Small Package Exemption Check (<= 10g or <= 10ml)
    let isSmallPackage = false;
    if (decl.net_quantity && decl.unit) {
      const q = parseFloat(decl.net_quantity);
      const u = decl.unit.toLowerCase().trim();
      if (!isNaN(q) && q <= 10.0 && ['g', 'gm', 'gms', 'ml', 'ml.'].includes(u)) {
        isSmallPackage = true;
      }
    }

    // 2. Rule 6(1)(b) Generic Name
    if (!decl.generic_name) {
      violations.push({
        rule_code: "Rule 6(1)(b)",
        declaration: "Generic Name",
        reason: "Common or generic name of commodity is missing from label",
        severity: "CRITICAL",
        suggested_correction: "Print standard common name prominently on Principal Display Panel"
      });
    }

    // 3. Rule 6(1)(c) Net Quantity Presence
    if (!decl.net_quantity || !decl.unit) {
      violations.push({
        rule_code: "Rule 6(1)(c)",
        declaration: "Net Quantity",
        reason: "Net quantity declaration is missing or incomplete",
        severity: "CRITICAL",
        suggested_correction: "Declare exact net weight/volume/count with standard SI symbol"
      });
    }

    // 4. Rule 6(1)(c) & Rule 13: Permissible Metric Units Check
    if (decl.unit) {
      const u = decl.unit.toLowerCase().replace(/\.$/, '').trim();
      const forbiddenUnits = {
        'gms': 'g',
        'gm': 'g',
        'kgs': 'kg',
        'ltr': 'l',
        'ltrs': 'l',
        'ml.': 'ml',
        'kilo': 'kg'
      };

      if (forbiddenUnits[u]) {
        violations.push({
          rule_code: "Rule 6(1)(c) & Rule 13",
          declaration: "Net Quantity Unit",
          reason: `Prohibited colloquial unit abbreviation '${decl.unit}'. Non-standard under Section 11 of Legal Metrology Act.`,
          severity: "CRITICAL",
          suggested_correction: `Use statutory SI symbol '${forbiddenUnits[u]}'`
        });
      }
    }

    // 5. Rule 6(1)(e): Maximum Retail Price (MRP)
    if (decl.mrp === null || decl.mrp === undefined || isNaN(decl.mrp)) {
      violations.push({
        rule_code: "Rule 6(1)(e)",
        declaration: "Maximum Retail Price (MRP)",
        reason: "MRP declaration (or Rs / ₹ price) is missing or illegible",
        severity: "CRITICAL",
        suggested_correction: "Declare MRP in Indian Rupees (e.g., 'MRP Rs. XX.XX incl. of all taxes')"
      });
    } else {
      // Check mandatory "inclusive of all taxes"
      if (decl.has_inclusive_phrase === false && !isSmallPackage) {
        violations.push({
          rule_code: "Rule 6(1)(e)",
          declaration: "Maximum Retail Price (MRP)",
          reason: "MRP declaration does not contain mandatory statutory phrase 'Inclusive of all taxes'",
          severity: "CRITICAL",
          suggested_correction: "Mandatory suffix 'Inclusive of all taxes' (or 'incl. of all taxes') must accompany MRP"
        });
      }
    }

    // 6. Rule 6(1)(d): Month & Year of Manufacture
    if (!decl.mfg_date && !isSmallPackage) {
      violations.push({
        rule_code: "Rule 6(1)(d)",
        declaration: "Month and Year of Manufacture",
        reason: "Date of manufacture/packaging is missing from label",
        severity: "CRITICAL",
        suggested_correction: "Declare Month and Year of manufacture (e.g., 'Mfg Date: MM/YYYY')"
      });
    }

    // 7. Rule 6(1)(a): Manufacturer / Packer Name & Address
    if (!decl.manufacturer && !isSmallPackage) {
      violations.push({
        rule_code: "Rule 6(1)(a)",
        declaration: "Manufacturer / Packer Details",
        reason: "Name and complete registered address of manufacturer/packer missing",
        severity: "CRITICAL",
        suggested_correction: "Print full name and postal address including state and PIN code"
      });
    }

    // 8. Rule 6(2): Consumer Care Contact Details
    if (!decl.consumer_care && !isSmallPackage) {
      violations.push({
        rule_code: "Rule 6(2)",
        declaration: "Consumer Care Contact",
        reason: "Mandatory consumer complaint redressal helpline/email is missing",
        severity: "WARNING",
        suggested_correction: "Provide phone number, email address or postal address for consumer grievance"
      });
    }

    // 9. Rule 6(11): Unit Sale Price (USP) Verification
    if (decl.mrp && decl.net_quantity && decl.unit) {
      const qVal = parseFloat(decl.net_quantity);
      if (!isNaN(qVal) && qVal > 0) {
        // Calculate expected USP
        const u = decl.unit.toLowerCase().trim();
        let referenceUnit = 'g';
        let factor = 1.0;

        if (['g', 'gm', 'gms'].includes(u)) {
          if (qVal >= 1000) { referenceUnit = 'kg'; factor = 1000.0; }
          else { referenceUnit = 'g'; factor = 1.0; }
        } else if (['kg', 'kgs'].includes(u)) {
          referenceUnit = 'kg';
          factor = 1.0;
        } else if (['ml', 'ml.'].includes(u)) {
          if (qVal >= 1000) { referenceUnit = 'l'; factor = 1000.0; }
          else { referenceUnit = 'ml'; factor = 1.0; }
        } else if (['l', 'ltr', 'ltrs'].includes(u)) {
          referenceUnit = 'l';
          factor = 1.0;
        }

        const calculatedUsp = (decl.mrp / qVal) * factor;

        // If declared USP exists, check tolerance
        if (decl.unit_sale_price) {
          const diff = Math.abs(decl.unit_sale_price - calculatedUsp);
          if (diff > 0.5) {
            violations.push({
              rule_code: "Rule 6(11)",
              declaration: "Unit Sale Price (USP) Mathematical Discrepancy",
              reason: `Declared USP (Rs. ${decl.unit_sale_price}/${referenceUnit}) does not match computed value (Rs. ${calculatedUsp.toFixed(2)}/${referenceUnit})`,
              severity: "CRITICAL",
              suggested_correction: `Correct Unit Sale Price to Rs. ${calculatedUsp.toFixed(2)} per ${referenceUnit}`
            });
          }
        }
      }
    }

    // 10. Barcode Checksum Validation (EAN-13 / UPC-A)
    if (decl.barcode && decl.barcode.length === 13) {
      const isValidBarcode = this.validateEAN13(decl.barcode);
      if (!isValidBarcode) {
        violations.push({
          rule_code: "Rule 6(1)(aa)",
          declaration: "Barcode Checksum",
          reason: `Invalid GS1 EAN-13 barcode checksum (${decl.barcode})`,
          severity: "WARNING",
          suggested_correction: "Verify barcode encoding and standard GS1 modulo-10 check digit"
        });
      }
    }

    // Overall Status Determination
    const criticalCount = violations.filter(v => v.severity === 'CRITICAL').length;
    let status = 'PASS';
    if (criticalCount > 0) {
      status = 'FAIL';
    } else if (violations.length > 0) {
      status = 'NEEDS_REVIEW';
    }

    return { status, violations };
  }

  /**
   * GS1 EAN-13 Modulo-10 Checksum Algorithm
   */
  static validateEAN13(barcode) {
    if (!/^\d{13}$/.test(barcode)) return false;
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(barcode[i], 10);
      sum += (i % 2 === 0) ? digit : digit * 3;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === parseInt(barcode[12], 10);
  }
}
