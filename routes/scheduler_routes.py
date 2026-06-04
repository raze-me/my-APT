import uuid
from datetime import datetime
import firebase_admin
from functools import wraps
from firebase_admin import auth, firestore
from flask import Blueprint, request, jsonify

scheduler_bp = Blueprint('scheduler_bp', __name__)

def get_db():
    try:
        return firestore.client()
    except Exception as e:
        print(f"Error accessing Firestore database client: {e}")
        return None

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]
            
            except IndexError:
                return jsonify({"error": "Invalid Authorization header format. Must be 'Bearer <token>"}), 401
            
            try: 
                decoded_token = auth.verify_id_token(token)

                request.user =  decoded_token
            except Exception as e:
                return jsonify({"error": f"Token verification failed: {str(e)}"}), 401
            
            return f(*args, **kwargs)
        return decorated
    

@scheduler_bp.route('/create', methods=['POST'])
@token_required
def create_scheduler():
    db = get_db()
    if not db: 
        return jsonify({
            "error": "Firestore database client not initialized. Please ensure a valid seviceAccountKey.json is placed in thee project root."
        }), 500
    
    data = request.get_json() or {}

    title = data.get('title')
    startDate = data.get('startDate')
    endDate = data.get('endDate')
    startTime = data.get('startTime')
    endTime = data.get('endTime')
    slotDuration = data.get('slotDuration')

    if not all([title, startDate, endDate, startTime, endTime, slotDuration]):
        return jsonify({
            "error": "Missing required fields. Provide: title, startDate, endDate, startTime, endTime, slotDuration"
        }), 400
    
    try:
        slotDuration = int(slotDuration)

    except(ValueError, TypeError):
        return jsonify({"error": "slotDuration must be a valid integer minutes count"}), 400
    
    publicLink = uuid.uuid4().hex[:10]

    ownerUid = request.user.get('uid')
    ownerEmail = request.user.get('email', '')

    scheduler_doc = {
        "ownerUid": ownerUid,
        "ownerEmail": ownerEmail,
        "title": title,
        "startDate": startDate,
        "endDate": endDate,
        "startTime": startTime,
        "endTime": endTime,
        "slotDuration": slotDuration,
        "publicLink": publicLink,
        "createdAt": datetime.utcnow()
    }

    try: 
        db.collection('schedulers').document(publicLink).set(scheduler_doc)

        scheduler_doc['createdAt'] = scheduler_doc['createdAt'].isoformat()

        return jsonify({
            "message": "Scheduler page created successfully",
            "publicLink": publicLink,
            "scheduler": scheduler_doc
        }), 201
    
    except Exception as e:
        return jsonify({"error": f"Failed to save to Firestore: {str(e)}"}), 500
    

@scheduler_bp.route('/my', methods = ['GET'])
@token_required
def get_my_scheduler():
    db = get_db()
    if not db: 
        return jsonify({"error": "Firestore databse client not initialized"}), 500
    
    ownerUid = request.user.get('uid')

    try: 
        docs = db.collection('scheduler').where('ownerUid', '==', ownerUid).stream()

        schedulers = []
        for doc in docs:
            d = doc.to_dict()

            if 'createdAr' in d and hasattr(d['created'], 'isoformat'):
                d['createdAt'] = d['createdAt'].isoformat()
            schedulers.append(d)

        return jsonify(schedulers), 200
    
    except Exception as e:
        return jsonify({"error": f"Failed to query database: {str(e)}"}), 500
    
@scheduler_bp.route('/public/<link>', methods=['GET'])
def get_public_scheduler(link):
    db = get_db()
    if not db:
        return jsonify({"error": f"Scheduler page with link code '{link}' not found"}), 404
    
    try:
        doc_ref = db.collection('scheduler').document(link).get()

        if not doc_ref.exists:
            return jsonify({"error": f"Scheduler page with link code '{link}' not found"}), 404
        
        d = doc_ref.to_dict()

        if 'createdAt' in d and hasattr(d['createdAt'], 'isoformat'):
            d['createdAt'] = d['createdAt'].isoformat()

        return jsonify(d), 200
    
    except Exception as e:
        return jsonify({"errpr": f"Failed to fetch document: {str(e)}"}), 500
    
