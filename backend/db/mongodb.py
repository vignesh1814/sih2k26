import os
import time
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv

load_dotenv()

try:
    # pyrefly: ignore [missing-import]
    from pymongo import MongoClient, DESCENDING
    PYMONGO_AVAILABLE = True
except ImportError:
    MongoClient = None
    DESCENDING = -1
    PYMONGO_AVAILABLE = False

MONGO_URI = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017")
DB_NAME = os.getenv("MONGO_DB_NAME", "sih26034_lmpc")

class MongoDBClient:
    _client = None
    _db = None
    _attempted_connect: bool = False
    
    # In-memory resilience fallback stores
    _in_memory_scans: List[Dict[str, Any]] = []
    _in_memory_audit_logs: List[Dict[str, Any]] = []
    _in_memory_reports: List[Dict[str, Any]] = []

    @classmethod
    def get_db(cls):
        if not PYMONGO_AVAILABLE:
            if not cls._attempted_connect:
                print("[INFO] PyMongo not installed. Operating in in-memory resilience mode.")
                cls._attempted_connect = True
            return None

        if cls._db is not None:
            return cls._db

        try:
            client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
            # Test connection ping
            client.admin.command('ping')
            cls._client = client
            cls._db = cls._client[DB_NAME]
            print(f"[INFO] Connected to MongoDB database '{DB_NAME}' at {MONGO_URI}")
            cls._init_indexes()
            return cls._db
        except Exception as e:
            if not cls._attempted_connect:
                print(f"[WARN] Local MongoDB connection failed: {e}. Operating in resilient in-memory fallback mode.")
                cls._attempted_connect = True
            cls._client = None
            cls._db = None
            return None

    @classmethod
    def is_connected(cls) -> bool:
        return cls.get_db() is not None

    @classmethod
    def _init_indexes(cls):
        if cls._db is not None and PYMONGO_AVAILABLE:
            try:
                cls._db.scans.create_index([("scan_id", 1)], unique=True)
                cls._db.scans.create_index([("created_at", DESCENDING)])
                cls._db.reports.create_index([("report_id", 1)], unique=True)
                cls._db.audit_logs.create_index([("timestamp", DESCENDING)])
            except Exception as e:
                print(f"[WARN] Failed creating MongoDB indexes: {e}")

    @classmethod
    def save_scan(cls, scan_record: Dict[str, Any]) -> bool:
        scan_record["created_at"] = scan_record.get("created_at") or time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
        db = cls.get_db()
        if db is not None:
            try:
                db.scans.update_one(
                    {"scan_id": scan_record["scan_id"]},
                    {"$set": scan_record},
                    upsert=True
                )
                return True
            except Exception as e:
                print(f"[ERROR] Failed saving scan to MongoDB: {e}")

        # In-memory fallback
        for i, s in enumerate(cls._in_memory_scans):
            if s.get("scan_id") == scan_record.get("scan_id"):
                cls._in_memory_scans[i] = scan_record
                return True
        cls._in_memory_scans.insert(0, scan_record)
        return True

    @classmethod
    def get_scan(cls, scan_id: str) -> Optional[Dict[str, Any]]:
        db = cls.get_db()
        if db is not None:
            try:
                record = db.scans.find_one({"scan_id": scan_id}, {"_id": 0})
                if record:
                    return record
            except Exception as e:
                print(f"[ERROR] Failed reading scan {scan_id} from MongoDB: {e}")
        
        # In-memory fallback
        for s in cls._in_memory_scans:
            if s.get("scan_id") == scan_id:
                return s
        return None

    @classmethod
    def list_scans(cls, limit: int = 50) -> List[Dict[str, Any]]:
        db = cls.get_db()
        if db is not None:
            try:
                records = list(db.scans.find({}, {"_id": 0}).sort("created_at", DESCENDING).limit(limit))
                return records
            except Exception as e:
                print(f"[ERROR] Failed listing scans from MongoDB: {e}")
        
        # In-memory fallback
        return cls._in_memory_scans[:limit]

    @classmethod
    def log_audit(cls, user_name: str, user_role: str, action: str, resource: str, details: str, status: str = "SUCCESS", ip_address: str = "127.0.0.1") -> bool:
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
        db = cls.get_db()
        if db is not None:
            try:
                db.audit_logs.insert_one(log_doc)
                return True
            except Exception as e:
                print(f"[ERROR] Failed logging audit to MongoDB: {e}")

        # In-memory fallback
        cls._in_memory_audit_logs.insert(0, log_doc)
        return True

    @classmethod
    def list_audit_logs(cls, limit: int = 100) -> List[Dict[str, Any]]:
        db = cls.get_db()
        if db is not None:
            try:
                records = list(db.audit_logs.find({}, {"_id": 0}).sort("timestamp", DESCENDING).limit(limit))
                return records
            except Exception as e:
                print(f"[ERROR] Failed listing audit logs from MongoDB: {e}")
        
        # In-memory fallback
        return cls._in_memory_audit_logs[:limit]
