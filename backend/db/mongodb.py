import os
import time
from typing import Dict, Any, List, Optional
from pymongo import MongoClient, DESCENDING
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017")
DB_NAME = os.getenv("MONGO_DB_NAME", "sih26034_lmpc")

class MongoDBClient:
    _client: Optional[MongoClient] = None
    _db = None

    @classmethod
    def get_db(cls):
        if cls._client is None:
            try:
                cls._client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
                # Test connection ping
                cls._client.admin.command('ping')
                cls._db = cls._client[DB_NAME]
                print(f"[INFO] Connected to MongoDB database '{DB_NAME}' at {MONGO_URI}")
                cls._init_indexes()
            except Exception as e:
                print(f"[WARN] Local MongoDB connection failed: {e}. Running in memory fallback mode.")
                return None
        return cls._db

    @classmethod
    def _init_indexes(cls):
        if cls._db is not None:
            try:
                cls._db.scans.create_index([("scan_id", 1)], unique=True)
                cls._db.scans.create_index([("created_at", DESCENDING)])
                cls._db.reports.create_index([("report_id", 1)], unique=True)
                cls._db.audit_logs.create_index([("timestamp", DESCENDING)])
            except Exception as e:
                print(f"[WARN] Failed creating MongoDB indexes: {e}")

    @classmethod
    def save_scan(cls, scan_record: Dict[str, Any]) -> bool:
        db = cls.get_db()
        if db is None:
            return False
        try:
            scan_record["created_at"] = scan_record.get("created_at") or time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
            db.scans.update_one(
                {"scan_id": scan_record["scan_id"]},
                {"$set": scan_record},
                upsert=True
            )
            return True
        except Exception as e:
            print(f"[ERROR] Failed saving scan to MongoDB: {e}")
            return False

    @classmethod
    def get_scan(cls, scan_id: str) -> Optional[Dict[str, Any]]:
        db = cls.get_db()
        if db is None:
            return None
        try:
            record = db.scans.find_one({"scan_id": scan_id}, {"_id": 0})
            return record
        except Exception as e:
            print(f"[ERROR] Failed reading scan {scan_id} from MongoDB: {e}")
            return None

    @classmethod
    def list_scans(cls, limit: int = 50) -> List[Dict[str, Any]]:
        db = cls.get_db()
        if db is None:
            return []
        try:
            records = list(db.scans.find({}, {"_id": 0}).sort("created_at", DESCENDING).limit(limit))
            return records
        except Exception as e:
            print(f"[ERROR] Failed listing scans from MongoDB: {e}")
            return []

    @classmethod
    def log_audit(cls, user_name: str, user_role: str, action: str, resource: str, details: str, status: str = "SUCCESS", ip_address: str = "127.0.0.1") -> bool:
        db = cls.get_db()
        if db is None:
            return False
        try:
            log_doc = {
                "timestamp": time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
                "user_name": user_name,
                "user_role": user_role,
                "action": action,
                "resource": resource,
                "details": details,
                "status": status,
                "ip_address": ip_address
            }
            db.audit_logs.insert_one(log_doc)
            return True
        except Exception as e:
            print(f"[ERROR] Failed logging audit to MongoDB: {e}")
            return False

    @classmethod
    def list_audit_logs(cls, limit: int = 100) -> List[Dict[str, Any]]:
        db = cls.get_db()
        if db is None:
            return []
        try:
            records = list(db.audit_logs.find({}, {"_id": 0}).sort("timestamp", DESCENDING).limit(limit))
            return records
        except Exception as e:
            print(f"[ERROR] Failed listing audit logs from MongoDB: {e}")
            return []
