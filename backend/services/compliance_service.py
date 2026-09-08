import json
import zen
from typing import List, Tuple
from backend.models.schemas import ExtractedDeclarations, RuleViolation
from auxiliary_modules.metric_unit_math import MetricUnitMathEngine
from auxiliary_modules.barcode_validator import BarcodeValidator

class ComplianceService:
    def __init__(self):
        self.engine = zen.ZenEngine()
        self.rule_decision = self._init_rule_decision()

    def _init_rule_decision(self):
        decision_content = {
            "nodes": [
                {"id": "in_node", "name": "Input Node", "type": "inputNode"},
                {
                    "id": "val_node",
                    "name": "LMPC Unit & Price Validator",
                    "type": "functionNode",
                    "content": """const handler = (input) => {
    const forbidden = ['gms', 'ltrs', 'kgs', 'gm', 'ml.', 'ltr', 'gms.', 'gm.'];
    const allowed = ['g', 'kg', 'ml', 'l', 'm', 'cm', 'mm', 'n', 'u'];
    
    let violations = [];
    
    // Check Unit
    if (input.unit) {
        const u = input.unit.toLowerCase().trim();
        if (forbidden.includes(u)) {
            violations.push({
                rule_code: "Rule 6(1)(c) & Rule 13",
                declaration: "Net Quantity Unit",
                reason: "Prohibited colloquial unit abbreviation '" + input.unit + "'. Non-standard under Section 11 of Act.",
                severity: "CRITICAL",
                suggested_correction: "Replace with statutory SI symbol (e.g., 'g' or 'kg')"
            });
        }
    }
    
    // Check MRP inclusive phrase
    if (input.mrp && input.has_inclusive_phrase === false) {
        violations.push({
            rule_code: "Rule 6(1)(e)",
            declaration: "Maximum Retail Price (MRP)",
            reason: "MRP does not contain mandatory statutory phrase 'Inclusive of all taxes'",
            severity: "CRITICAL",
            suggested_correction: "Mandatory suffix 'Inclusive of all taxes' must accompany MRP"
        });
    }

    return { violations: violations };
};"""
                },
                {"id": "out_node", "name": "Output Node", "type": "outputNode"}
            ],
            "edges": [
                {"id": "e1", "sourceId": "in_node", "targetId": "val_node"},
                {"id": "e2", "sourceId": "val_node", "targetId": "out_node"}
            ]
        }
        return self.engine.create_decision(decision_content)

    def evaluate_compliance(self, decl: ExtractedDeclarations) -> Tuple[str, List[RuleViolation]]:
        violations: List[RuleViolation] = []

        # 1. Rule 26 Small Package Exemption Check
        if decl.net_quantity and decl.unit:
            try:
                qty_val = float(decl.net_quantity)
                u = decl.unit.lower().strip()
                if (u in ['g', 'gm', 'gms'] and qty_val <= 10.0) or (u in ['ml', 'ml.'] and qty_val <= 10.0):
                    # Small package exempt from many declarations under Rule 26
                    pass
            except Exception:
                pass

        # 2. Required Declarations Presence Checks
        if not decl.generic_name:
            violations.append(RuleViolation(
                rule_code="Rule 6(1)(b)",
                declaration="Generic Name",
                reason="Common or generic name of commodity is missing from label",
                severity="CRITICAL"
            ))

        if not decl.net_quantity or not decl.unit:
            violations.append(RuleViolation(
                rule_code="Rule 6(1)(c)",
                declaration="Net Quantity",
                reason="Net quantity declaration is missing or incomplete",
                severity="CRITICAL"
            ))

        if decl.mrp is None:
            violations.append(RuleViolation(
                rule_code="Rule 6(1)(e)",
                declaration="Maximum Retail Price",
                reason="MRP declaration is missing or illegible",
                severity="CRITICAL"
            ))

        if not decl.mfg_date:
            violations.append(RuleViolation(
                rule_code="Rule 6(1)(d)",
                declaration="Month and Year of Manufacture",
                reason="Manufacturing / packing date is missing from label",
                severity="CRITICAL"
            ))

        if not decl.manufacturer:
            violations.append(RuleViolation(
                rule_code="Rule 6(1)(a)",
                declaration="Manufacturer / Packer Details",
                reason="Name and complete registered address of manufacturer/packer missing",
                severity="CRITICAL"
            ))

        if not decl.consumer_care:
            violations.append(RuleViolation(
                rule_code="Rule 6(2)",
                declaration="Consumer Care Contact",
                reason="Mandatory consumer complaint redressal helpline/email is missing",
                severity="WARNING"
            ))

        # 3. Unit validation via MetricUnitMathEngine
        if decl.unit:
            unit_check = MetricUnitMathEngine.validate_unit_symbol(decl.unit)
            if not unit_check["is_valid"]:
                # Check if not already added
                if not any(v.rule_code.startswith("Rule 6(1)(c)") for v in violations):
                    violations.append(RuleViolation(
                        rule_code="Rule 6(1)(c) & Rule 13",
                        declaration="Net Quantity Unit",
                        reason=unit_check.get("reason", "Prohibited unit abbreviation"),
                        severity="CRITICAL",
                        suggested_correction=f"Use standard unit: {unit_check.get('permitted_alternative')}"
                    ))

        # 4. Unit Sale Price check under Rule 6(11) (2022 Amendment)
        if decl.mrp and decl.net_quantity and decl.unit:
            try:
                qty_f = float(decl.net_quantity)
                # Parse mfg date to see if post Oct 2022
                is_post_2022 = True
                if decl.mfg_date:
                    import re
                    m_yr = re.search(r'(20\d{2})', decl.mfg_date)
                    if m_yr:
                        yr = int(m_yr.group(1))
                        if yr < 2022:
                            is_post_2022 = False
                
                usp_check = MetricUnitMathEngine.verify_unit_sale_price(
                    mrp=decl.mrp,
                    net_quantity=qty_f,
                    unit=decl.unit,
                    declared_usp=decl.unit_sale_price,
                    mfg_date_post_oct_2022=is_post_2022
                )
                if not usp_check.get("is_compliant", True):
                    violations.append(RuleViolation(
                        rule_code="Rule 6(11)",
                        declaration="Unit Sale Price (USP)",
                        reason=usp_check.get("violation", "Incorrect or missing Unit Sale Price"),
                        severity="CRITICAL",
                        suggested_correction=f"Statutory USP should be declared per standard unit"
                    ))
            except Exception:
                pass

        # 5. Barcode Origin Verification
        if decl.barcode:
            barcode_res = BarcodeValidator.validate_ean13(decl.barcode, declared_country_of_origin=decl.country_of_origin)
            if not barcode_res["is_valid"]:
                violations.append(RuleViolation(
                    rule_code="Rule 6(1)(aa)",
                    declaration="Barcode Checksum",
                    reason=f"Corrupt or invalid GS1 barcode ({decl.barcode})",
                    severity="WARNING"
                ))

        # 6. Zen Engine rule evaluation (JDM Graph execution)
        try:
            zen_res = self.rule_decision.evaluate({
                "unit": decl.unit or "",
                "mrp": decl.mrp or 0.0,
                "has_inclusive_phrase": decl.has_inclusive_phrase if decl.has_inclusive_phrase is not None else True
            })
            zen_violations = zen_res.get("result", {}).get("violations", [])
            for zv in zen_violations:
                if not any(v.rule_code == zv["rule_code"] for v in violations):
                    violations.append(RuleViolation(
                        rule_code=zv["rule_code"],
                        declaration=zv["declaration"],
                        reason=zv["reason"],
                        severity=zv.get("severity", "CRITICAL"),
                        suggested_correction=zv.get("suggested_correction")
                    ))
        except Exception as e:
            print(f"[WARN] Zen Engine evaluation error: {e}")

        # Determine overall status
        critical_violations = [v for v in violations if v.severity == "CRITICAL"]
        if critical_violations:
            status = "FAIL"
        elif violations:
            status = "NEEDS_REVIEW"
        else:
            status = "PASS"

        return status, violations
