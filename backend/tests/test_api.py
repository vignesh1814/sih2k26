import os
import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "HEALTHY"
    assert "RapidOCR" in data["ocr_engine"]

def test_demo_endpoint():
    response = client.get("/api/v1/demo/compliant_biscuit")
    assert response.status_code == 200
    data = response.json()
    assert data["compliance_status"] == "PASS"

def test_scan_synthetic_image():
    image_path = os.path.join("synthetic_dataset", "images", "SYN_000.png")
    if not os.path.exists(image_path):
        pytest.skip("Synthetic sample image not found")

    with open(image_path, "rb") as f:
        response = client.post(
            "/api/v1/scan",
            files={"file": ("SYN_000.png", f, "image/png")}
        )
    assert response.status_code == 200
    data = response.json()
    assert "scan_id" in data
    assert data["status"] in ["PASS", "FAIL", "NEEDS_REVIEW", "INSUFFICIENT_EVIDENCE"]
    assert len(data["detections"]) > 0
    assert data["declarations"]["generic_name"] is not None

def test_scan_multi_endpoint():
    img1 = os.path.join("synthetic_dataset", "images", "SYN_000.png")
    img2 = os.path.join("synthetic_dataset", "images", "SYN_002.png")
    if not os.path.exists(img1) or not os.path.exists(img2):
        pytest.skip("Synthetic samples not found")

    with open(img1, "rb") as f1, open(img2, "rb") as f2:
        response = client.post(
            "/api/v1/scan-multi",
            files=[
                ("files", ("SYN_000.png", f1, "image/png")),
                ("files", ("SYN_002.png", f2, "image/png")),
            ],
            data={"panel_names": ["Front (PDP)", "Back Panel"]}
        )
    assert response.status_code == 200
    data = response.json()
    assert "scan_id" in data
    assert data["status"] in ["PASS", "FAIL", "NEEDS_REVIEW", "INSUFFICIENT_EVIDENCE"]
    assert "Fused" in data["message"] or "evidence" in data["message"].lower()
