
from flask import Blueprint, jsonify
from firebase_admin import firestore
from utils.slot_generator import generate_slots

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
            start_time=scheduler_data.get('startDate'),
            endDate=scheduler_data.get('endDate'),
            startTime = scheduler_data.get('startTime'),
            endTime = scheduler_data.get('endTime'),
            slot_duration_mins=scheduler_data.get('slotduration'),
            booked_slots=booked_slots
        )

        return jsonify(available_slots), 200
        
    except Exception as e:
        return jsonify({
            "error": f"Failed to compute available slots: {str(e)}"
        }), 500
