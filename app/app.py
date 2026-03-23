import os
from datetime import datetime

from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
from pymongo.errors import PyMongoError
import certifi

app = Flask(__name__)
CORS(app)

MONGO_URI = os.getenv("MONGO_URI", "")
mongo_client = None
alerts_collection = None
reports_collection = None
resources_collection = None
db_error = None

seed_alerts = [
    {
        "id": 1,
        "type": "Flood",
        "location": "Agra South Zone",
        "message": "Move to higher ground. Avoid Yamuna riverbanks.",
        "severity": "High",
        "timestamp": "2024-01-15T10:00:00",
    },
    {
        "id": 2,
        "type": "Fire",
        "location": "Sikandra Industrial Area",
        "message": "Evacuate 1.5 km radius immediately.",
        "severity": "Medium",
        "timestamp": "2024-01-15T11:30:00",
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


def serialize_doc(doc):
    result = dict(doc)
    if "_id" in result:
        result["_id"] = str(result["_id"])
    return result


def next_id(collection):
    last_item = collection.find_one(sort=[("id", -1)])
    return (last_item.get("id", 0) if last_item else 0) + 1


def require_db():
    if alerts_collection is None or reports_collection is None or resources_collection is None:
        raise RuntimeError(db_error or "MongoDB is not connected.")


def init_database():
    global mongo_client, alerts_collection, reports_collection, resources_collection, db_error

    if not MONGO_URI:
        db_error = "MONGO_URI is not set. Provide a MongoDB URI."
        print(f"[ResQNet] {db_error}")
        return

    if not (MONGO_URI.startswith("mongodb+srv://") or MONGO_URI.startswith("mongodb://")):
        db_error = "MONGO_URI must start with mongodb+srv:// or mongodb://"
        print(f"[ResQNet] {db_error}")
        return

    try:
        client_kwargs = {
            "serverSelectionTimeoutMS": 10000,
        }
        if MONGO_URI.startswith("mongodb+srv://"):
            client_kwargs["tlsCAFile"] = certifi.where()

        mongo_client = MongoClient(MONGO_URI, **client_kwargs)
        mongo_client.admin.command("ping")
        db = mongo_client["resqnet"]
        alerts_collection = db["alerts"]
        reports_collection = db["reports"]
        resources_collection = db["resources"]

        if alerts_collection.count_documents({}) == 0:
            alerts_collection.insert_many(seed_alerts)
        if resources_collection.count_documents({}) == 0:
            resources_collection.insert_many(seed_resources)

        db_error = None
        print("[ResQNet] Connected to MongoDB.")
    except PyMongoError as exc:
        alerts_collection = None
        reports_collection = None
        resources_collection = None
        db_error = f"MongoDB connection failed: {exc}"
        print(f"[ResQNet] {db_error}")


init_database()


@app.route("/api/alerts", methods=["GET"])
def get_alerts():
    try:
        require_db()
        records = alerts_collection.find({}, {"_id": 0}).sort("id", 1)
        return jsonify([serialize_doc(item) for item in records])
    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 503


@app.route("/api/alerts", methods=["POST"])
def create_alert():
    try:
        require_db()
        data = request.get_json() or {}
        data["id"] = next_id(alerts_collection)
        data["timestamp"] = datetime.now().isoformat()
        alerts_collection.insert_one(data)
        return jsonify(serialize_doc(data)), 201
    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 503


@app.route("/api/reports", methods=["GET"])
def get_reports():
    try:
        require_db()
        records = reports_collection.find({}, {"_id": 0}).sort("id", 1)
        return jsonify([serialize_doc(item) for item in records])
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


@app.route("/api/resources", methods=["GET"])
def get_resources():
    try:
        require_db()
        records = resources_collection.find({}, {"_id": 0}).sort("id", 1)
        return jsonify([serialize_doc(item) for item in records])
    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 503


@app.route("/health", methods=["GET"])
def health():
    return jsonify(
        {
            "status": "healthy",
            "app": "ResQNet API",
            "dbConnected": db_error is None,
            "dbError": db_error,
        }
    )


@app.route("/", methods=["GET"])
def home():
    return jsonify(
        {
            "app": "ResQNet API",
            "message": "ResQNet backend is running.",
            "dbConnected": db_error is None,
            "endpoints": [
                "/health",
                "/api/alerts",
                "/api/reports",
                "/api/resources",
            ],
        }
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
