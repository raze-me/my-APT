
from flask import Blueprint, jsonify, request
from firebase_admin import firestore
from utils.slot_generator import generate_slots
from routes.scheduler_routes import token_required
from datetime import datetime

booking_bp = Blueprint('booking_bp', __name__)

def get_db():
    try: 
        return firestore.client()
    except Exception as e:
        print(f"Error accesing Firestore database client in booking: {e}")
        return None


@booking_bp.route('/slots/<link>', methods=['GET'])
def get_available_slots(link):
    db = get_db()
    if not db:
        return jsonify({
            "error": "Firestore database client not initialized. Please ensure a valid serviceAccountKey.json is placed in the project root."
        }), 500
    
    try:

        scheduler_doc = db.collection('schedulers').document(link).get()

        if not scheduler_doc.exists:
            return jsonify({
                "error": f"Scheduler page with link code '{link}' not found"
            }), 404
        
        scheduler_data = scheduler_doc.to_dict()

        bookings_ref = db.collection('bookings').where('schedulerLink', '==', link).stream()

        booked_slots = []

        for doc in bookings_ref:
            booking = doc.to_dict()

            booked_slots.append({
                "date": booking.get('date'),
                "startTime": booking.get('startTime')
            })

        available_slots = generate_slots(
            start_date=scheduler_data.get('startDate'),
            end_date=scheduler_data.get('endDate'),
            start_time=scheduler_data.get('startTime'),
            end_time=scheduler_data.get('endTime'),
            slot_duration_mins=scheduler_data.get('slotDuration'),
            booked_slots=booked_slots
        )

        return jsonify(available_slots), 200
        
    except Exception as e:
        return jsonify({
            "error": f"Failed to compute available slots: {str(e)}"
        }), 500

@booking_bp.route('/book', methods=['POST'])
def book_slot():
    from flask import request
    db = get_db()
    if not db:
        return jsonify({"error": "Firestore database client not initialized."}), 500
    
    try:
        data = request.get_json() or {}
        schedulerLink = data.get('schedulerLink')
        date = data.get('date')
        startTime = data.get('startTime')
        endTime = data.get('endTime')
        customerName = data.get('customerName')
        customerEmail = data.get('customerEmail')
        customerMessage = data.get('customerMessage', '')

        if not all([schedulerLink, date, startTime, endTime, customerName, customerEmail]):
            return jsonify({"error": "Missing required fields for booking."}), 400

        scheduler_doc = db.collection('schedulers').document(schedulerLink).get()
        if not scheduler_doc.exists:
            return jsonify({"error": f"Scheduler page with link code '{schedulerLink}' not found"}), 404

        existing_bookings = db.collection('bookings') \
            .where('schedulerLink', '==', schedulerLink) \
            .where('date', '==', date) \
            .where('startTime', '==', startTime) \
            .stream()
        
        for doc in existing_bookings:
            return jsonify({"error": "This slot has already been booked."}), 400

        from datetime import datetime
        booking_id = f"{schedulerLink}_{date}_{startTime.replace(':', '')}"
        booking_doc = {
            "schedulerLink": schedulerLink,
            "date": date,
            "startTime": startTime,
            "endTime": endTime,
            "customerName": customerName,
            "customerEmail": customerEmail,
            "customerMessage": customerMessage,
            "createdAt": datetime.utcnow()
        }

        db.collection('bookings').document(booking_id).set(booking_doc)

        booking_doc['createdAt'] = booking_doc['createdAt'].isoformat()
        return jsonify({
            "message": "Appointment booked successfully",
            "booking": booking_doc
        }), 201

    except Exception as e:
        return jsonify({"error": f"Failed to complete booking: {str(e)}"}), 500

@booking_bp.route('/my', methods=['GET'])
@token_required
def get_my_bookings():
    db = get_db()
    if not db:
        return jsonify({"error": "Firestore database client not initialized."}), 500
    
    owner_uid = request.user.get('uid')

    try: 
        scheduler_docs = db.collection('schedulers').where('ownerUid', '==', owner_uid).stream()

        scheduler_links = []
        for doc in scheduler_docs:
            d = doc.to_dict()
            scheduler_links.append(d.get('publicLink'))

        if not scheduler_links:
            return jsonify([]), 200
        
        all_bookings = []
        for link in scheduler_links:
            bookings_ref = db.collection('bookings').where('schedulerLink', '==', link).stream()
            for doc in bookings_ref:
                b = doc.to_dict()
                if 'createdAt' in b and hasattr(b['createdAt'], 'isoformat'):
                    b['createdAt'] = b['createdAt'].isoformat()
                all_bookings.append(b)

        all_bookings.sort(key=lambda x: (x.get('date', ''), x.get('startTime', '')))

        return jsonify(all_bookings), 200
    
    except Exception as e:
        return jsonify({
            "error": f"Failed to fetch bookings: {str(e)}"
        }), 500
