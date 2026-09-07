"""
Comprehensive Unit Tests for Deterministic LMPC Compliance Rule Engine.
Validates:
- Rule 6 Declarations (MRP, Net Quantity, Unit Sale Price, Consumer Care)
- Rule 7 Principal Display Panel (PDP) area calculation & Table I font height checks
- Rule 13 Standard SI units vs Prohibited non-standard units
- Rule 26 Statutory Exemptions (<=10g, <=10ml, >50kg agri, restaurant food, loose garments)
"""
import pytest
import math
import json
import os

@pytest.fixture
def ontology_data():
    ontology_path = os.path.join(os.path.dirname(__file__), "legal_ontology_mapping.json")
    with open(ontology_path, "r", encoding="utf-8") as f:
        return json.load(f)


class LMPCValidator:
    ALLOWED_UNITS = {'g', 'kg', 'ml', 'l', 'm', 'cm', 'mm', 'n', 'u'}
    FORBIDDEN_UNITS = {'gms', 'gms.', 'gm', 'gm.', 'kgs', 'kgs.', 'kilo', 'kilos', 'ltr', 'ltrs', 'ltr.', 'ml.', 'cc'}

    TABLE_I = [
        (50, 1.0, 2.0),
        (100, 1.5, 3.0),
        (500, 2.5, 4.0),
        (2500, 4.0, 6.0),
        (float('inf'), 6.0, 6.0)
    ]

    @classmethod
    def validate_net_quantity(cls, qty_str):
        parts = qty_str.strip().split()
        if len(parts) != 2:
            return False, "Invalid format. Expected <number> <unit>"
        num, unit = parts[0], parts[1].lower()
        if unit in cls.FORBIDDEN_UNITS:
            return False, f"Non-standard unit '{unit}' rejected under Rule 6(1)(c) and Rule 13"
        if unit not in cls.ALLOWED_UNITS:
            return False, f"Unknown unit '{unit}'"
        return True, "PASS"

    @classmethod
    def validate_unit_sale_price(cls, mrp, net_qty, declared_usp, mfg_date_post_oct_2022=True):
        if not mfg_date_post_oct_2022:
            return True, "USP not required for pre-Oct 2022 manufacture"
        if declared_usp is None:
            return False, "Missing Unit Sale Price mandated under Rule 6(11)"
        expected_usp = round(mrp / net_qty, 2)
        if abs(expected_usp - declared_usp) > 0.05:
            return False, f"Math mismatch: Expected Rs.{expected_usp:.2f}, found Rs.{declared_usp:.2f}"
        return True, "PASS"

    @classmethod
    def validate_mrp_phrase(cls, mrp_text):
        mrp_lower = mrp_text.lower()
        if "inclusive of all taxes" not in mrp_lower and "incl. of all taxes" not in mrp_lower:
            return False, "MRP must include 'inclusive of all taxes' under Rule 6(1)(e)"
        return True, "PASS"

    @classmethod
    def validate_consumer_care(cls, contact_dict):
        # Must have telephone, email, address under Rule 6(2)
        required = ['phone', 'email', 'address']
        for r in required:
            if not contact_dict.get(r):
                return False, f"Missing mandatory consumer care channel: '{r}' under Rule 6(2)"
        return True, "PASS"

    @classmethod
    def calculate_pdp_area(cls, shape, **dims):
        if shape == "rectangular":
            return dims['height_cm'] * dims['width_cm']
        elif shape == "cylindrical":
            # 40% of height * circumference
            return 0.40 * dims['height_cm'] * dims['circumference_cm']
        elif shape == "other":
            return 0.40 * dims['total_surface_area_cm2']
        else:
            raise ValueError(f"Unknown shape: {shape}")

    @classmethod
    def validate_font_height(cls, pdp_area_cm2, font_height_mm, is_blown_or_molded=False):
        for max_area, min_normal, min_molded in cls.TABLE_I:
            if pdp_area_cm2 <= max_area:
                required = min_molded if is_blown_or_molded else min_normal
                if font_height_mm < required:
                    return False, f"Font height {font_height_mm}mm < required {required}mm for PDP area {pdp_area_cm2}cm2 under Rule 7 Table I"
                return True, "PASS"
        return False, "Invalid PDP Area"

    @classmethod
    def check_rule_26_exemption(cls, commodity, qty_value, unit, **extra):
        # Clause (a): <=10g or <=10ml except tobacco
        if commodity.lower() in ['tobacco', 'cigarettes', 'bidi']:
            return False, "NON_EXEMPT (Tobacco products excluded from Rule 26(a))"
        if unit in ['g', 'ml'] and qty_value <= 10:
            return True, "EXEMPT under Rule 26(a)"
        # Clause (b): Restaurant fast food
        if extra.get('is_restaurant_food'):
            return True, "EXEMPT under Rule 26(b)"
        # Clause (d): Bulk agri produce > 50kg
        if unit == 'kg' and qty_value > 50 and extra.get('is_agricultural_produce'):
            return True, "EXEMPT under Rule 26(d)"
        # Clause (e): Institutional consumers
        if extra.get('is_institutional') and extra.get('marked_not_for_retail_sale'):
            return True, "EXEMPT under Rule 26(e)"
        # Clause (f): Loose garments
        if extra.get('is_loose_garment_with_inspection'):
            return True, "EXEMPT under Rule 26(f)"
        return False, "NON_EXEMPT"

# --- PYTEST TEST CASES ---

def test_compliant_net_quantity():
    ok, msg = LMPCValidator.validate_net_quantity("500 g")
    assert ok is True
    assert msg == "PASS"

def test_violating_net_quantity_gms():
    ok, msg = LMPCValidator.validate_net_quantity("500 gms")
    assert ok is False
    assert "rejected under Rule 6(1)(c)" in msg

def test_unit_sale_price_correct():
    ok, msg = LMPCValidator.validate_unit_sale_price(mrp=100.0, net_qty=500, declared_usp=0.20)
    assert ok is True

def test_unit_sale_price_missing_post_2022():
    ok, msg = LMPCValidator.validate_unit_sale_price(mrp=100.0, net_qty=500, declared_usp=None)
    assert ok is False
    assert "Missing Unit Sale Price" in msg

def test_mrp_phrase_missing():
    ok, msg = LMPCValidator.validate_mrp_phrase("MRP Rs. 50.00")
    assert ok is False
    assert "inclusive of all taxes" in msg

def test_consumer_care_missing_email():
    ok, msg = LMPCValidator.validate_consumer_care({'phone': '1800-111-222', 'address': 'Plot 4, Mumbai'})
    assert ok is False
    assert "email" in msg

def test_pdp_area_rectangular():
    area = LMPCValidator.calculate_pdp_area("rectangular", height_cm=10, width_cm=8)
    assert area == 80.0

def test_pdp_area_cylindrical():
    # 40% of height * circumference
    area = LMPCValidator.calculate_pdp_area("cylindrical", height_cm=20, circumference_cm=15)
    assert area == 120.0

def test_table_I_font_height_compliance():
    # Area 80 cm2 -> threshold is 1.5mm normal
    ok, _ = LMPCValidator.validate_font_height(pdp_area_cm2=80, font_height_mm=1.8)
    assert ok is True
    # Area 80 cm2 -> font 1.2mm is non-compliant
    ok, msg = LMPCValidator.validate_font_height(pdp_area_cm2=80, font_height_mm=1.2)
    assert ok is False
    assert "Font height 1.2mm < required 1.5mm" in msg

def test_rule_26_exemption_trigger():
    exempt, msg = LMPCValidator.check_rule_26_exemption("shampoo", 5, "g")
    assert exempt is True
    assert "EXEMPT under Rule 26(a)" in msg

def test_rule_26_tobacco_not_exempt():
    exempt, msg = LMPCValidator.check_rule_26_exemption("tobacco", 5, "g")
    assert exempt is False
    assert "NON_EXEMPT" in msg

def test_rule_26_bulk_agri_exemption():
    exempt, msg = LMPCValidator.check_rule_26_exemption("wheat", 60, "kg", is_agricultural_produce=True)
    assert exempt is True
    assert "EXEMPT under Rule 26(d)" in msg

import json
import os

def load_ontology():
    path = r"c:\Users\vignesh theerdala\OneDrive\Desktop\sihhh\sih26034-research\legal_ontology_mapping.json"
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def test_wholesale_exemption():
    ontology_data = load_ontology()
    pkg_type_rules = ontology_data["Package_Types"]["wholesale"]
    assert pkg_type_rules["requires_mrp"] == False
    assert pkg_type_rules["requires_manufacturer_address"] == True

def test_jurisdiction_fssai_ignore():
    ontology_data = load_ontology()
    ignored = ontology_data["Jurisdiction_Rules"]["ignore_entities"]
    assert "fssai_license" in ignored
    assert "veg_logo" in ignored

def test_penalties_mapping():
    ontology_data = load_ontology()
    missing = ontology_data["Jan_Vishwas_Penalties"]["missing_declaration"]
    assert missing["offense_type"] == "civil_wrong"
    assert "compound" in missing["action"]
