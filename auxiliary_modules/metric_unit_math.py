"""
Module 3: Metric Unit Math & Deceptive Pricing Verification Engine
Strictly validates SI standard unit abbreviations and computes Unit Sale Price (USP)
per Rule 6(11) of the Legal Metrology (Packaged Commodities) Amendment Rules, 2022.
"""

from decimal import Decimal, ROUND_HALF_UP

class MetricUnitMathEngine:
    # Rule 6(1)(c) permitted SI symbols
    PERMITTED_UNITS = {
        "mass": {"g": "gram", "kg": "kilogram"},
        "volume": {"ml": "millilitre", "l": "litre"},
        "length": {"cm": "centimetre", "m": "metre"},
        "area": {"sq cm": "square centimetre", "sq m": "square metre"},
        "count": {"n": "number", "u": "unit", "piece": "piece", "pc": "piece"}
    }

    # Explicitly forbidden colloquial / non-standard abbreviations
    FORBIDDEN_UNIT_ABBREVIATIONS = {
        "gms": "Use 'g' for grams",
        "gm": "Use 'g' for grams",
        "ltrs": "Use 'L' or 'l' for litres",
        "ltr": "Use 'L' or 'l' for litres",
        "kgs": "Use 'kg' for kilograms",
        "ml.": "Symbols must not be followed by a full stop unless at the end of a sentence"
    }

    @classmethod
    def validate_unit_symbol(cls, unit_str):
        """
        Validates whether a unit abbreviation conforms to Rule 6(1)(c).
        """
        cleaned = str(unit_str).strip().lower()
        if cleaned in cls.FORBIDDEN_UNIT_ABBREVIATIONS:
            return {
                "is_valid": False,
                "found_unit": unit_str,
                "correction": cls.FORBIDDEN_UNIT_ABBREVIATIONS[cleaned],
                "statutory_reference": "Rule 6(1)(c) of LMPC Rules, 2011",
                "status": "FAIL"
            }

        # Check in permitted units
        for dimension, unit_dict in cls.PERMITTED_UNITS.items():
            if cleaned in unit_dict:
                return {
                    "is_valid": True,
                    "dimension": dimension,
                    "standard_symbol": cleaned,
                    "status": "PASS"
                }

        return {
            "is_valid": False,
            "found_unit": unit_str,
            "correction": "Unrecognized measurement unit",
            "statutory_reference": "Legal Metrology Act, 2009 (Metric System)",
            "status": "FAIL"
        }

    @staticmethod
    def calculate_statutory_usp(mrp, net_quantity, unit):
        """
        Calculates statutory Unit Sale Price rounded to 2 decimal places per Rule 6(11).
        Formula: USP = MRP / Quantity (using Decimal for exact monetary precision).
        """
        mrp_dec = Decimal(str(mrp))
        qty_dec = Decimal(str(net_quantity))

        if qty_dec <= 0:
            raise ValueError("Net quantity must be strictly greater than zero.")

        raw_usp = mrp_dec / qty_dec
        # Round half up to exactly 2 decimal places
        rounded_usp = raw_usp.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        return float(rounded_usp)

    @classmethod
    def verify_unit_sale_price(cls, mrp, net_quantity, unit, declared_usp, mfg_date_post_oct_2022=True):
        """
        Verifies declared USP against mathematically computed statutory USP.
        Tolerance: ±0.02 INR to allow for legitimate rounding variations.
        """
        # 1. First validate unit symbol
        unit_check = cls.validate_unit_symbol(unit)
        if not unit_check["is_valid"]:
            return {
                "is_compliant": False,
                "unit_check": unit_check,
                "violation": "Non-standard unit symbol used in quantity declaration",
                "status": "FAIL"
            }

        if not mfg_date_post_oct_2022:
            return {
                "is_compliant": True,
                "note": "Unit Sale Price declaration optional for products manufactured prior to Oct 1, 2022",
                "status": "EXEMPT"
            }

        if declared_usp is None:
            return {
                "is_compliant": False,
                "violation": "Mandatory Unit Sale Price (USP) declaration omitted under 2022 amendment",
                "statutory_reference": "Rule 6(11) of LMPC Amendment Rules, 2022",
                "status": "FAIL"
            }

        expected_usp = cls.calculate_statutory_usp(mrp, net_quantity, unit)
        diff = abs(expected_usp - float(declared_usp))

        if diff > 0.02:
            return {
                "is_compliant": False,
                "expected_usp": expected_usp,
                "declared_usp": float(declared_usp),
                "difference": round(diff, 2),
                "violation": f"Math discrepancy in Unit Sale Price: Expected Rs.{expected_usp:.2f}, found Rs.{float(declared_usp):.2f}",
                "statutory_reference": "Rule 6(11) (Deceptive or inaccurate price declaration)",
                "status": "FAIL"
            }

        return {
            "is_compliant": True,
            "expected_usp": expected_usp,
            "declared_usp": float(declared_usp),
            "unit": unit,
            "status": "PASS"
        }

if __name__ == '__main__':
    print("Testing Module 3: Metric Unit Math Engine in isolation...")
    engine = MetricUnitMathEngine()

    # Test 1: Permitted unit vs illegal abbreviation
    print("Test 1a ('500 g'):", engine.validate_unit_symbol("g")["status"])
    test_illegal = engine.validate_unit_symbol("gms")
    print("Test 1b ('500 gms'):", test_illegal["status"], "-", test_illegal["correction"])

    # Test 2: Valid USP calculation (MRP: Rs. 150 for 500g -> Rs. 0.30/g)
    usp_ok = engine.verify_unit_sale_price(mrp=150.0, net_quantity=500, unit="g", declared_usp=0.30)
    print("Test 2 (Accurate USP):", usp_ok["status"])

    # Test 3: Deceptive / inaccurate USP (MRP: Rs. 150 for 500g, but declared Rs. 0.20/g to appear cheaper)
    usp_bad = engine.verify_unit_sale_price(mrp=150.0, net_quantity=500, unit="g", declared_usp=0.20)
    print("Test 3 (Deceptive USP):", usp_bad["status"], "-", usp_bad.get("violation"))
