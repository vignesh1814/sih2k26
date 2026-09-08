import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.api.scan import router as scan_router
from backend.api.report import router as report_router
from backend.api.health import router as health_router

app = FastAPI(
    title="SIH26034 - Legal Metrology (LMPC) Compliance Engine",
    description="Automated statutory compliance audit API for packaged commodities in India.",
    version="1.0.0"
)

# Open CORS policy for Android / Mobile / Frontend clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(scan_router)
app.include_router(report_router)

# Mount local synthetic dataset for authentic label image serving
DATASET_DIR = os.path.join(os.getcwd(), "synthetic_dataset")
if os.path.exists(DATASET_DIR):
    app.mount("/dataset", StaticFiles(directory=DATASET_DIR), name="dataset")

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
