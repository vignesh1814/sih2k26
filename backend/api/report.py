import os
import time
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from backend.models.schemas import ReportRequest, ReportResponse
from backend.services.report_service import ReportService
from backend.api.scan import SCAN_CACHE, UPLOAD_DIR

router = APIRouter(prefix="/api/v1", tags=["Report"])

@router.post("/report/generate", response_model=ReportResponse)
async def generate_report(req: ReportRequest):
    scan_data = SCAN_CACHE.get(req.scan_id)
    if not scan_data:
        raise HTTPException(status_code=404, detail="Scan ID session not found")

    pdf_filename = f"challan_{req.scan_id}.pdf"
    pdf_path = os.path.join(UPLOAD_DIR, pdf_filename)

    ReportService.generate_pdf(
        scan_id=req.scan_id,
        image_path=scan_data["image_path"],
        status=scan_data["status"],
        decl=scan_data["declarations"],
        violations=scan_data["violations"],
        evidence_hash=scan_data["evidence_hash"],
        output_pdf_path=pdf_path
    )

    from backend.db.mongodb import MongoDBClient
    try:
        db = MongoDBClient.get_db()
        if db is not None:
            db.reports.update_one(
                {"report_id": req.scan_id},
                {"$set": {
                    "report_id": req.scan_id,
                    "scan_id": req.scan_id,
                    "pdf_url": f"/api/v1/report/{req.scan_id}/download",
                    "evidence_hash": scan_data["evidence_hash"],
                    "generated_at": time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
                    "officer_name": req.officer_name or "Legal Metrology Inspector",
                    "station_jurisdiction": req.station_jurisdiction or "HQ Central Zone"
                }},
                upsert=True
            )
            MongoDBClient.log_audit(
                user_name=req.officer_name or "Legal Metrology Inspector",
                user_role="INSPECTOR",
                action="REPORT_GENERATE",
                resource=f"/api/v1/report/{req.scan_id}/download",
                details=f"Statutory Form II Challan PDF generated for scan ID: {req.scan_id}"
            )
    except Exception as e:
        print(f"[WARN] Failed writing report record to MongoDB: {e}")

    return ReportResponse(
        report_id=req.scan_id,
        pdf_url=f"/api/v1/report/{req.scan_id}/download",
        evidence_hash=scan_data["evidence_hash"],
        generated_at=time.strftime('%Y-%m-%d %H:%M:%S'),
        status="READY"
    )

@router.get("/report/{scan_id}/download")
async def download_report(scan_id: str):
    pdf_filename = f"challan_{scan_id}.pdf"
    pdf_path = os.path.join(UPLOAD_DIR, pdf_filename)

    if not os.path.exists(pdf_path):
        # Auto-generate if not pre-generated
        scan_data = SCAN_CACHE.get(scan_id)
        if not scan_data:
            raise HTTPException(status_code=404, detail="Report not found")
        ReportService.generate_pdf(
            scan_id=scan_id,
            image_path=scan_data["image_path"],
            status=scan_data["status"],
            decl=scan_data["declarations"],
            violations=scan_data["violations"],
            evidence_hash=scan_data["evidence_hash"],
            output_pdf_path=pdf_path
        )

    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename=f"LMPC_Challan_{scan_id}.pdf"
    )
