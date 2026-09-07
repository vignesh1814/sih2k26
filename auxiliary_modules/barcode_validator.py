"""
Module 2: GS1 Barcode Validator
Validates EAN-13 / UPC barcode structure, computes Modulo-10 check digits,
and decodes GS1 Country Prefixes while applying common-sense legal rules
(i.e., GS1 prefix indicates registration agency, not manufacturing origin).
"""

class BarcodeValidator:
    # Selected GS1 Member Organization Prefix Table
    GS1_PREFIX_TABLE = {
        "890": "GS1 India",
        "000": "GS1 US", "001": "GS1 US", "002": "GS1 US", "003": "GS1 US",
        "400": "GS1 Germany", "401": "GS1 Germany", "402": "GS1 Germany",
        "450": "GS1 Japan", "490": "GS1 Japan",
        "500": "GS1 UK", "501": "GS1 UK",
        "690": "GS1 China", "691": "GS1 China", "692": "GS1 China", "693": "GS1 China",
        "885": "GS1 Thailand",
        "893": "GS1 Vietnam",
        "880": "GS1 South Korea"
    }

    @staticmethod
    def calculate_modulo_10_check_digit(digits_str):
        """
        Computes the standard GS1 Modulo-10 check digit for an incomplete barcode
        (e.g., 12 digits for EAN-13, or 11 digits for UPC-A).
        """
        # Weighting: Alternating 1 and 3 from right to left
        reversed_digits = [int(d) for d in reversed(digits_str)]
        weighted_sum = sum(d * (3 if i % 2 == 0 else 1) for i, d in enumerate(reversed_digits))
        check_digit = (10 - (weighted_sum % 10)) % 10
        return check_digit

    @classmethod
    def validate_ean13(cls, barcode_str, declared_country_of_origin=None):
        """
        Validates an EAN-13 barcode string.
        Optionally cross-checks with declared country of origin without creating false violations.
        """
        cleaned = "".join(filter(str.isdigit, str(barcode_str).strip()))

        if len(cleaned) != 13:
            return {
                "is_valid": False,
                "barcode": barcode_str,
                "error": f"Invalid length: Expected 13 digits, found {len(cleaned)}",
                "status": "FAIL"
            }

        data_digits = cleaned[:12]
        declared_check_digit = int(cleaned[12])
        expected_check_digit = cls.calculate_modulo_10_check_digit(data_digits)

        if declared_check_digit != expected_check_digit:
            return {
                "is_valid": False,
                "barcode": cleaned,
                "expected_check_digit": expected_check_digit,
                "found_check_digit": declared_check_digit,
                "error": "Modulo-10 checksum mismatch: Corrupted or forged barcode",
                "status": "FAIL"
            }

        # Decode GS1 Member Organization
        prefix_3 = cleaned[:3]
        gs1_org = cls.GS1_PREFIX_TABLE.get(prefix_3, "Other GS1 Member Organization")
        is_gs1_india = (prefix_3 == "890")

        # Origin Cross-Check with common-sense legal rules
        origin_analysis = {
            "declared_origin": declared_country_of_origin,
            "gs1_member_org": gs1_org,
            "cross_check_status": "COMPLIANT"
        }

        if declared_country_of_origin:
            origin_lower = declared_country_of_origin.lower()
            if is_gs1_india and ("india" not in origin_lower):
                # Common-sense rule: An Indian brand importing from abroad can legally use 890
                origin_analysis["cross_check_status"] = "VALID_IMPORT_WITH_INDIAN_BARCODE"
                origin_analysis["note"] = (
                    "Product declared as imported, but licensed by GS1 India brand owner. "
                    "Legally permissible under LMPC Rule 6(1)(aa)."
                )

        return {
            "is_valid": True,
            "barcode": cleaned,
            "gs1_prefix": prefix_3,
            "gs1_organization": gs1_org,
            "is_gs1_india": is_gs1_india,
            "origin_analysis": origin_analysis,
            "status": "PASS"
        }

if __name__ == '__main__':
    print("Testing Module 2: GS1 Barcode Validator in isolation...")
    validator = BarcodeValidator()

    # Test 1: Valid Indian EAN-13 barcode (Maggi 2-min noodles sample: 8901058852394)
    test1 = validator.validate_ean13("8901058852394")
    print("Test 1 (Valid 890 Barcode):", test1["status"], "-", test1["gs1_organization"])

    # Test 2: Corrupted check digit
    test2 = validator.validate_ean13("8901058852398")
    print("Test 2 (Corrupted Barcode):", test2["status"], "-", test2.get("error"))

    # Test 3: Legal Import (Indian brand importing from Vietnam)
    test3 = validator.validate_ean13("8901058852394", declared_country_of_origin="Vietnam")
    print("Test 3 (Legal Import with 890):", test3["origin_analysis"]["cross_check_status"])
