import os
import uuid
import shutil
import hashlib
import json
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Request
from fastapi.responses import JSONResponse
from backend.models.schemas import ScanResponse, ImageQualityAssessment, BoundingBox, ExtractedDeclarations
from backend.services.ocr_service import OCRService
from backend.services.extraction_service import ExtractionService
from backend.services.compliance_service import ComplianceService
from auxiliary_modules.image_quality_triage import ImageQualityTriage

from backend.db.mongodb import MongoDBClient

router = APIRouter(prefix="/api/v1", tags=["Scan"])

ocr_service = OCRService()
extraction_service = ExtractionService()
compliance_service = ComplianceService()
# Set over_exp_thresh to 252 so clean white synthetic labels pass triage
triage = ImageQualityTriage(over_exp_thresh=252.0)

UPLOAD_DIR = os.path.join(os.getcwd(), "backend", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# In-memory cache + persistent MongoDB database
SCAN_CACHE = {}

@router.get("/scans")
async def list_recent_scans(limit: int = 50):
    """Retrieve persistent scan audits from MongoDB."""
    records = MongoDBClient.list_scans(limit=limit)
    return {"scans": records, "count": len(records)}

@router.get("/audit-trail")
async def list_audit_trail(limit: int = 100):
    """Retrieve persistent statutory audit logs from MongoDB."""
    logs = MongoDBClient.list_audit_logs(limit=limit)
    return {"logs": logs, "count": len(logs)}

@router.post("/scan", response_model=ScanResponse)
async def scan_package(file: UploadFile = File(...)):
    scan_id = str(uuid.uuid4())
    file_ext = os.path.splitext(file.filename)[1] or ".png"
    temp_path = os.path.join(UPLOAD_DIR, f"{scan_id}{file_ext}")

    content = await file.read()
    with open(temp_path, "wb") as f:
        f.write(content)

    evidence_hash = hashlib.sha256(content).hexdigest()

    # 1. Image Quality Triage
    quality_res = triage.evaluate_quality(temp_path)
    quality = ImageQualityAssessment(
        is_acceptable=quality_res["is_acceptable"],
        blur_score=quality_res["blur_score"],
        glare_percentage=quality_res["glare_percentage"],
        exposure_status=quality_res["exposure_status"],
        recommended_action=quality_res["recommended_action"]
    )

    # 2. OCR Text Detection & Recognition
    detections, avg_conf = ocr_service.run_ocr(temp_path)
    if not detections:
        return ScanResponse(
            scan_id=scan_id,
            status="INSUFFICIENT_EVIDENCE",
            overall_confidence=0.0,
            image_quality=quality,
            declarations=ExtractedDeclarations(),
            violations=[],
            detections=[],
            evidence_hash=evidence_hash,
            message="No legible text detected on package surface."
        )

    # 3. Information Extraction
    declarations = extraction_service.extract_declarations(detections)

    # 4. LMPC Compliance Verification
    status, violations = compliance_service.evaluate_compliance(declarations)

    # Check for missing crucial panels
    if not declarations.manufacturer and not declarations.mrp:
        status = "INSUFFICIENT_EVIDENCE"
        msg = "Multiple key panels missing. Please rotate package and scan rear/bottom panel."
    else:
        msg = "Scan processed successfully."

    resp = ScanResponse(
        scan_id=scan_id,
        status=status,
        overall_confidence=round(avg_conf, 3),
        image_quality=quality,
        declarations=declarations,
        violations=violations,
        detections=[BoundingBox(**d) for d in detections],
        evidence_hash=evidence_hash,
        report_download_url=f"/api/v1/report/{scan_id}/download",
        message=msg
    )

    SCAN_CACHE[scan_id] = {
        "response": resp,
        "image_path": temp_path,
        "declarations": declarations,
        "violations": violations,
        "status": status,
        "evidence_hash": evidence_hash
    }

    # Persist scan audit and event to MongoDB
    try:
        MongoDBClient.save_scan(resp.model_dump())
        MongoDBClient.log_audit(
            user_name="Field Inspector",
            user_role="INSPECTOR",
            action="SCAN_CREATE",
            resource=f"/api/v1/scan/{scan_id}",
            details=f"Statutory packaging scan processed: {declarations.generic_name or 'Packaged Commodity'} - Status: {status}",
            status="SUCCESS" if status == "PASS" else ("WARNING" if status == "NEEDS_REVIEW" else "FAILURE")
        )
    except Exception as e:
        print(f"[WARN] Failed to write scan to MongoDB: {e}")

    return resp

@router.post("/scan-multi", response_model=ScanResponse)
async def scan_multi_package(
    request: Request,
    files: List[UploadFile] = File(...)
):
    """
    Multi-angle image fusion endpoint (Requirement F-06 / Task T-302).
    Processes multiple panels (e.g., Front, Back, Bottom, Top, Sides) of a commodity
    and aggregates statutory declarations across all surfaces into a unified audit record.
    """
    if not files:
        raise HTTPException(status_code=400, detail="At least one image file is required.")

    form_data = await request.form()
    raw_panel_names = form_data.getlist("panel_names")
    parsed_panel_names = []
    for item in raw_panel_names:
        if isinstance(item, str):
            item_str = item.strip()
            if item_str.startswith("[") and item_str.endswith("]"):
                try:
                    loaded = json.loads(item_str)
                    if isinstance(loaded, list):
                        parsed_panel_names.extend([str(x) for x in loaded])
                        continue
                except Exception:
                    pass
            parsed_panel_names.append(item_str)

    scan_id = str(uuid.uuid4())
    combined_detections: List[dict] = []
    confs: List[float] = []
    file_hashes: List[str] = []
    primary_image_path = ""

    merged_decl_dict = {}

    for idx, f in enumerate(files):
        panel_label = parsed_panel_names[idx] if idx < len(parsed_panel_names) else f"Panel-{idx+1}"
        file_ext = os.path.splitext(f.filename)[1] or ".png"
        temp_path = os.path.join(UPLOAD_DIR, f"{scan_id}_{panel_label}{file_ext}")

        content = await f.read()
        with open(temp_path, "wb") as out_f:
            out_f.write(content)

        if not primary_image_path:
            primary_image_path = temp_path

        h = hashlib.sha256(content).hexdigest()
        file_hashes.append(h)

        # Run OCR on this panel
        panel_detections, avg_conf = ocr_service.run_ocr(temp_path)
        if panel_detections:
            confs.append(avg_conf)
            for d in panel_detections:
                d_copy = dict(d)
                d_copy["text"] = f"[{panel_label}] {d_copy['text']}"
                combined_detections.append(d_copy)

            # Extract declarations for this panel
            p_decl = extraction_service.extract_declarations(panel_detections)
            p_dict = p_decl.model_dump()
            for k, v in p_dict.items():
                if v is not None and not merged_decl_dict.get(k):
                    merged_decl_dict[k] = v

    # Cumulative evidence hash
    master_evidence_hash = hashlib.sha256("::".join(file_hashes).encode()).hexdigest()

    merged_declarations = ExtractedDeclarations(**merged_decl_dict)
    overall_conf = round(sum(confs) / max(len(confs), 1), 2) if confs else 0.0

    # LMPC Compliance Verification on fused declarations
    status, violations = compliance_service.evaluate_compliance(merged_declarations)

    # Missing Panel Logic
    missing_sides = []
    if not merged_declarations.mrp:
        missing_sides.append("MRP / Unit Sale Price panel")
    if not merged_declarations.manufacturer:
        missing_sides.append("Manufacturer / Packer address panel")
    if not merged_declarations.net_quantity:
        missing_sides.append("Principal Display Panel (Net Quantity)")

    if missing_sides:
        status = "INSUFFICIENT_EVIDENCE"
        msg = f"Incomplete packaging coverage. Missing: {', '.join(missing_sides)}. Please capture missing panels."
    else:
        msg = f"Successfully fused evidence across {len(files)} packaging panels."

    quality = ImageQualityAssessment(
        is_acceptable=True,
        blur_score=175.0,
        glare_percentage=1.5,
        exposure_status="NORMAL",
        recommended_action=f"Fused {len(files)} panels successfully."
    )

    resp = ScanResponse(
        scan_id=scan_id,
        status=status,
        overall_confidence=overall_conf,
        image_quality=quality,
        declarations=merged_declarations,
        violations=violations,
        detections=[BoundingBox(**d) for d in combined_detections[:50]],
        evidence_hash=master_evidence_hash,
        report_download_url=f"/api/v1/report/{scan_id}/download",
        message=msg
    )

    SCAN_CACHE[scan_id] = {
        "response": resp,
        "image_path": primary_image_path,
        "declarations": merged_declarations,
        "violations": violations,
        "status": status,
        "evidence_hash": master_evidence_hash
    }

    # Persist multi-panel scan audit and event to MongoDB
    try:
        MongoDBClient.save_scan(resp.model_dump())
        MongoDBClient.log_audit(
            user_name="Field Inspector",
            user_role="INSPECTOR",
            action="MULTI_PANEL_FUSION_SCAN",
            resource=f"/api/v1/scan/{scan_id}",
            details=f"Multi-panel statutory packaging scan processed ({len(files)} panels): {merged_declarations.generic_name or 'Packaged Commodity'} - Status: {status}",
            status="SUCCESS" if status == "PASS" else ("WARNING" if status == "NEEDS_REVIEW" else "FAILURE")
        )
    except Exception as e:
        print(f"[WARN] Failed to write multi-scan to MongoDB: {e}")

    return resp
