import os
import base64
import secrets
from datetime import datetime, timedelta
from functools import wraps

from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
from pymongo.errors import PyMongoError
from werkzeug.security import generate_password_hash, check_password_hash
import certifi

app = Flask(__name__)
CORS(app)

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'resqnet-secret-key-2026')
MONGO_URI = os.getenv("MONGO_URI", "")
UPLOAD_FOLDER = '/tmp/resqnet_uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Database connections
mongo_client = None
db = None
alerts_collection = None
reports_collection = None
resources_collection = None
officials_collection = None
comments_collection = None
sessions_collection = None
db_error = None

# Seed data
seed_alerts = [
    {
        "id": 1,
        "type": "Flood",
        "location": "Agra South Zone",
        "message": "Move to higher ground. Avoid Yamuna riverbanks.",
        "severity": "High",
        "timestamp": "2024-01-15T10:00:00",
        "status": "active",
        "photos": [],
    },
    {
        "id": 2,
        "type": "Fire",
        "location": "Sikandra Industrial Area",
        "message": "Evacuate 1.5 km radius immediately.",
        "severity": "Medium",
        "timestamp": "2024-01-15T11:30:00",
        "status": "active",
        "photos": [],
    },
]

seed_resources = [
    {
        "id": 1,
        "name": "District Hospital",
        "type": "Hospital",
        "location": "MG Road, Agra",
        "distance_km": 1.2,
    },
    {
        "id": 2,
        "name": "Civil Lines Shelter",
        "type": "Shelter",
        "location": "Civil Lines, Agra",
        "capacity": 340,
        "distance_km": 2.1,
    },
    {
        "id": 3,
        "name": "NDRF Rescue Team",
        "type": "Rescue",
        "location": "Active Deployment",
        "distance_km": 3.4,
    },
]

# Utility functions
def serialize_doc(doc):
    result = dict(doc)
    if "_id" in result:
        result["_id"] = str(result["_id"])
    return result

def next_id(collection):
    last_item = collection.find_one(sort=[("id", -1)])
    return (last_item.get("id", 0) if last_item else 0) + 1

def require_db():
    if alerts_collection is None:
        raise RuntimeError(db_error or "MongoDB is not connected.")

def require_official(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({"error": "Missing authorization token"}), 401
        
        session_doc = sessions_collection.find_one({"token": token})
        if not session_doc or datetime.fromisoformat(session_doc['expires']) < datetime.now():
            return jsonify({"error": "Invalid or expired token"}), 401
        
        request.official_id = session_doc['official_id']
        return f(*args, **kwargs)
    return decorated_function

def init_database():
    global mongo_client, db, alerts_collection, reports_collection, resources_collection
    global officials_collection, comments_collection, sessions_collection, db_error

    if not MONGO_URI:
        db_error = "MONGO_URI is not set."
        print(f"[ResQNet] {db_error}")
        return

    if not (MONGO_URI.startswith("mongodb+srv://") or MONGO_URI.startswith("mongodb://")):
        db_error = "MONGO_URI must start with mongodb+srv:// or mongodb://"
        print(f"[ResQNet] {db_error}")
        return

    try:
        client_kwargs = {"serverSelectionTimeoutMS": 10000}
        if MONGO_URI.startswith("mongodb+srv://"):
            client_kwargs["tlsCAFile"] = certifi.where()

        mongo_client = MongoClient(MONGO_URI, **client_kwargs)
        mongo_client.admin.command("ping")
        
        db = mongo_client["resqnet"]
        alerts_collection = db["alerts"]
        reports_collection = db["reports"]
        resources_collection = db["resources"]
        officials_collection = db["officials"]
        comments_collection = db["comments"]
        sessions_collection = db["sessions"]

        # Seed data
        if alerts_collection.count_documents({}) == 0:
            alerts_collection.insert_many(seed_alerts)
        if resources_collection.count_documents({}) == 0:
            resources_collection.insert_many(seed_resources)

        # Create indexes
        sessions_collection.create_index("expires", expireAfterSeconds=0)

        db_error = None
        print("[ResQNet] Connected to MongoDB.")
    except PyMongoError as exc:
        db_error = f"MongoDB connection failed: {exc}"
        print(f"[ResQNet] {db_error}")

init_database()

# ==================== AUTHENTICATION ====================

@app.route("/auth/register", methods=["POST"])
def register():
    try:
        require_db()
        data = request.get_json() or {}
        email = data.get("email", "").strip()
        password = data.get("password", "").strip()
        name = data.get("name", "").strip()

        if not email or not password or not name:
            return jsonify({"error": "Email, password, and name required"}), 400

        if officials_collection.find_one({"email": email}):
            return jsonify({"error": "Email already registered"}), 409

        official_doc = {
            "email": email,
            "password": generate_password_hash(password),
            "name": name,
            "created_at": datetime.now().isoformat(),
        }
        result = officials_collection.insert_one(official_doc)
        official_doc["_id"] = str(result.inserted_id)
        official_doc.pop("password", None)

        return jsonify({"message": "Official registered", "official": serialize_doc(official_doc)}), 201
    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 503

@app.route("/auth/login", methods=["POST"])
def login():
    try:
        require_db()
        data = request.get_json() or {}
        email = data.get("email", "").strip()
        password = data.get("password", "").strip()

        if not email or not password:
            return jsonify({"error": "Email and password required"}), 400

        official = officials_collection.find_one({"email": email})
        if not official or not check_password_hash(official["password"], password):
            return jsonify({"error": "Invalid email or password"}), 401

        token = secrets.token_urlsafe(32)
        expires = (datetime.now() + timedelta(hours=24)).isoformat()
        
        sessions_collection.insert_one({
            "token": token,
            "official_id": str(official["_id"]),
            "email": email,
            "created_at": datetime.now().isoformat(),
            "expires": expires,
        })

        return jsonify({
            "token": token,
            "official": {
                "_id": str(official["_id"]),
                "email": official["email"],
                "name": official["name"],
            }
        }), 200
    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 503

@app.route("/auth/logout", methods=["POST"])
@require_official
def logout():
    try:
        require_db()
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        sessions_collection.delete_one({"token": token})
        return jsonify({"message": "Logged out"}), 200
    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 503

# ==================== ALERTS ====================

@app.route("/api/alerts", methods=["GET"])
def get_alerts():
    try:
        require_db()
        status = request.args.get("status", "all")
        
        query = {}
        if status != "all":
            query["status"] = status

        records = alerts_collection.find(query, {"_id": 0}).sort("id", -1)
        return jsonify([serialize_doc(item) for item in records]), 200
    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 503

@app.route("/api/alerts/<int:alert_id>", methods=["GET"])
def get_alert(alert_id):
    try:
        require_db()
        alert = alerts_collection.find_one({"id": alert_id}, {"_id": 0})
        if not alert:
            return jsonify({"error": "Alert not found"}), 404
        return jsonify(serialize_doc(alert)), 200
    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 503

@app.route("/api/alerts", methods=["POST"])
def create_alert():
    try:
        require_db()
        data = request.get_json() or {}
        data["id"] = next_id(alerts_collection)
        data["timestamp"] = datetime.now().isoformat()
        data["status"] = "active"
        data["photos"] = []
        
        alerts_collection.insert_one(data)
        return jsonify(serialize_doc(data)), 201
    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 503

@app.route("/api/alerts/<int:alert_id>/status", methods=["PATCH"])
@require_official
def update_alert_status(alert_id):
    try:
        require_db()
        data = request.get_json() or {}
        status = data.get("status", "").strip()

        if status not in ["active", "solved"]:
            return jsonify({"error": "Invalid status"}), 400

        result = alerts_collection.update_one(
            {"id": alert_id},
            {"$set": {"status": status, "updated_at": datetime.now().isoformat()}}
        )
        
        if result.matched_count == 0:
            return jsonify({"error": "Alert not found"}), 404

        alert = alerts_collection.find_one({"id": alert_id}, {"_id": 0})
        return jsonify(serialize_doc(alert)), 200
    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 503

@app.route("/api/alerts/<int:alert_id>", methods=["DELETE"])
@require_official
def delete_alert(alert_id):
    try:
        require_db()
        result = alerts_collection.delete_one({"id": alert_id})
        
        if result.deleted_count == 0:
            return jsonify({"error": "Alert not found"}), 404

        comments_collection.delete_many({"alert_id": alert_id})
        return jsonify({"message": "Alert deleted"}), 200
    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 503

# ==================== PHOTOS ====================

@app.route("/api/alerts/<int:alert_id>/photos", methods=["POST"])
def upload_photo(alert_id):
    try:
        require_db()
        
        alert = alerts_collection.find_one({"id": alert_id})
        if not alert:
            return jsonify({"error": "Alert not found"}), 404

        data = request.get_json() or {}
        photo_data = data.get("photo", "")
        caption = data.get("caption", "No description")

        if not photo_data:
            return jsonify({"error": "No photo provided"}), 400

        photo_doc = {
            "alert_id": alert_id,
            "data": photo_data,
            "caption": caption,
            "uploaded_at": datetime.now().isoformat(),
        }
        result = comments_collection.insert_one(photo_doc)

        alerts_collection.update_one(
            {"id": alert_id},
            {"$push": {"photos": str(result.inserted_id)}}
        )

        return jsonify({"message": "Photo uploaded", "photo_id": str(result.inserted_id)}), 201
    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 503

# ==================== COMMENTS ====================

@app.route("/api/alerts/<int:alert_id>/comments", methods=["GET"])
def get_comments(alert_id):
    try:
        require_db()
        
        comments = comments_collection.find(
            {"alert_id": alert_id, "type": "comment"},
            {"_id": 0}
        ).sort("created_at", -1)
        
        return jsonify([serialize_doc(c) for c in comments]), 200
    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 503

@app.route("/api/alerts/<int:alert_id>/comments", methods=["POST"])
@require_official
def add_comment(alert_id):
    try:
        require_db()
        
        alert = alerts_collection.find_one({"id": alert_id})
        if not alert:
            return jsonify({"error": "Alert not found"}), 404

        data = request.get_json() or {}
        text = data.get("text", "").strip()

        if not text:
            return jsonify({"error": "Comment text required"}), 400

        comment_doc = {
            "alert_id": alert_id,
            "type": "comment",
            "text": text,
            "official_id": request.official_id,
            "created_at": datetime.now().isoformat(),
        }
        result = comments_collection.insert_one(comment_doc)
        comment_doc["_id"] = str(result.inserted_id)

        return jsonify(serialize_doc(comment_doc)), 201
    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 503

@app.route("/api/comments/<comment_id>", methods=["DELETE"])
@require_official
def delete_comment(comment_id):
    try:
        require_db()
        from bson.objectid import ObjectId
        
        result = comments_collection.delete_one({"_id": ObjectId(comment_id)})
        
        if result.deleted_count == 0:
            return jsonify({"error": "Comment not found"}), 404

        return jsonify({"message": "Comment deleted"}), 200
    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 503

# ==================== REPORTS ====================

@app.route("/api/reports", methods=["GET"])
def get_reports():
    try:
        require_db()
        records = reports_collection.find({}, {"_id": 0}).sort("id", 1)
        return jsonify([serialize_doc(item) for item in records]), 200
    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 503

@app.route("/api/reports", methods=["POST"])
def create_report():
    try:
        require_db()
        data = request.get_json() or {}
        data["id"] = next_id(reports_collection)
        data["timestamp"] = datetime.now().isoformat()
        reports_collection.insert_one(data)
        return jsonify(serialize_doc(data)), 201
    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 503

# ==================== RESOURCES ====================

@app.route("/api/resources", methods=["GET"])
def get_resources():
    try:
        require_db()
        records = resources_collection.find({}, {"_id": 0}).sort("id", 1)
        return jsonify([serialize_doc(item) for item in records]), 200
    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 503

# ==================== HEALTH ====================

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy",
        "app": "ResQNet API",
        "dbConnected": db_error is None,
        "dbError": db_error,
    }), 200

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "app": "ResQNet API",
        "version": "2.0",
        "features": [
            "Real-time alerts with status tracking",
            "Photo uploads from camera or device",
            "OAuth-style login for officials",
            "Comments on alerts",
            "Alert history and archive",
        ],
        "endpoints": {
            "public": [
                "GET /api/alerts",
                "GET /api/alerts/:id",
                "POST /api/alerts",
                "POST /api/reports",
                "GET /api/resources",
            ],
            "officials_only": [
                "POST /auth/login",
                "POST /auth/register",
                "PATCH /api/alerts/:id/status",
                "DELETE /api/alerts/:id",
                "POST /api/alerts/:id/comments",
                "DELETE /api/comments/:id",
            ],
        },
    }), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
