"""
Module 5: Hackathon Live Demo Replay & Offline Fallback Daemon
Provides deterministic, zero-latency mock responses for presentation scenarios
to protect the team from venue Wi-Fi failures during SIH live judging.
Can be imported as a Python class or run as a standalone local HTTP server.
"""

import json
from http.server import HTTPServer, BaseHTTPRequestHandler

class DemoOfflineFallback:
    GOLDEN_DEMO_CASES = {
        "compliant_biscuit": {
            "item_name": "Standard Parle-G Biscuit 250g",
            "compliance_status": "PASS",
            "is_offline_replay": True,
            "declarations": {
                "manufacturer": "Parle Products Pvt Ltd, Mumbai, Maharashtra",
                "generic_name": "Biscuits",
                "net_quantity": "250 g",
                "mrp": "Rs. 25.00 (Inclusive of all taxes)",
                "unit_sale_price": "Rs. 0.10/g",
                "mfg_date": "05/2026",
                "consumer_care": "1800-22-1022 | care@parle.biz"
            },
            "violations": [],
            "bounding_boxes": [
                {"label": "PDP", "bbox": [15, 10, 780, 480]},
                {"label": "MRP_Area", "bbox": [40, 110, 360, 140]},
                {"label": "NetQty_Area", "bbox": [40, 70, 240, 100]}
            ]
        },
        "obscured_mrp_violation": {
            "item_name": "Kinley Water Bottle (MRP Obscured)",
            "compliance_status": "FAIL",
            "is_offline_replay": True,
            "declarations": {
                "manufacturer": "Hindustan Coca-Cola Beverages Pvt Ltd",
                "generic_name": "Packaged Drinking Water",
                "net_quantity": "1 L",
                "mrp": None,
                "unit_sale_price": None,
                "mfg_date": "06/2026"
            },
            "violations": [
                {
                    "rule_code": "R6(1)(e)",
                    "statutory_reference": "Rule 6(1)(e) of LMPC Rules 2011",
                    "description": "Maximum Retail Price (MRP) missing or illegally obscured"
                }
            ],
            "bounding_boxes": [
                {"label": "PDP", "bbox": [20, 15, 750, 470]},
                {"label": "NetQty_Area", "bbox": [40, 80, 200, 110]}
            ]
        },
        "non_standard_unit_violation": {
            "item_name": "Namkeen Pouch (Illegal Unit)",
            "compliance_status": "FAIL",
            "is_offline_replay": True,
            "declarations": {
                "manufacturer": "Haldiram Snacks Pvt Ltd",
                "generic_name": "Bhujia Sev",
                "net_quantity": "400 gms",
                "mrp": "Rs. 110.00 (Inclusive of all taxes)",
                "unit_sale_price": "Rs. 0.28/g"
            },
            "violations": [
                {
                    "rule_code": "R6(1)(c)",
                    "statutory_reference": "Rule 6(1)(c) of LMPC Rules 2011",
                    "description": "Non-standard unit 'gms' used instead of statutory SI unit 'g'"
                }
            ],
            "bounding_boxes": [
                {"label": "NetQty_Area", "bbox": [40, 70, 220, 95]}
            ]
        }
    }

    @classmethod
    def get_response(cls, scenario_key="compliant_biscuit"):
        return cls.GOLDEN_DEMO_CASES.get(scenario_key, cls.GOLDEN_DEMO_CASES["compliant_biscuit"])

class MockServerHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        # Route based on path (e.g. /demo/compliant or /demo/violation)
        path = self.path.lower()
        if "obscured" in path or "mrp" in path:
            data = DemoOfflineFallback.get_response("obscured_mrp_violation")
        elif "unit" in path or "gms" in path:
            data = DemoOfflineFallback.get_response("non_standard_unit_violation")
        else:
            data = DemoOfflineFallback.get_response("compliant_biscuit")
            
        self.wfile.write(json.dumps(data, indent=2).encode('utf-8'))

    def log_message(self, format, *args):
        # Silence console access logs during demo
        return

def run_local_mock_server(port=8088):
    server = HTTPServer(('127.0.0.1', port), MockServerHandler)
    print(f"SIH Offline Fallback Mock Server running at http://127.0.0.1:{port}/")
    print("Press Ctrl+C to stop.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nMock server stopped.")

if __name__ == '__main__':
    print("Testing Module 5: Offline Fallback in isolation...")
    fallback = DemoOfflineFallback()
    res1 = fallback.get_response("compliant_biscuit")
    print("Scenario 1 (Compliant):", res1["compliance_status"], "-", res1["item_name"])
    res2 = fallback.get_response("obscured_mrp_violation")
    print("Scenario 2 (Violating):", res2["compliance_status"], "-", res2["violations"][0]["rule_code"])
