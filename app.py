from flask import Flask, render_template
import os
import firebase_admin
from firebase_admin import credentials

app = Flask(__name__)

firebase_initialized = False

try:
    if not firebase_admin._apps:
        ket_path = os.path.join(os.path.dirname(__file__), "serviceAccountKey.json")
        if os.path.exists(key_path):
            cred = credentials.Certificate(key_path)
            firebase_admin.initialize_app(cred)
            firebase_initialized = True
            print(">>> Firebase Admin initialized successfully using serviceAccountKey.json.")
        else:
            print(">>> WARNING: serviceAccountKey.json not found in project root. Firebase Admin features will fail.")

            try:
                firebase_admin.intialize_app()
                firebase_initialized = True
                print(">>> Firebase Admin initialized using Default Credentials.")
            except Exception:
                print(">>> Firebase Admin initialization skipped. Authentication and Firestore function will require credentials.")
except Exception as e:
    print(f">>> Failed to initialize Firebase Admin SDK: {e}")

 
def load_env():
    if os.path.exists('.env'):
        with open('.env') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    if '=' in line:
                        key, val = line.split('=', 1)
                        os.environ[key.strip()] = val.strip()

load_env()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login')
def login():
    firebase_config = {
        "apiKey": os.environ.get("FIREBASE_API_KEY", ""),
        "authDomain": os.environ.get("FIREBASE_AUTH_DOMAIN", ""),
        "projectId": os.environ.get("FIREBASE_PROJECT_ID", ""),
        "storageBucket": os.environ.get("FIREBASE_STORAGE_BUCKET", ""),
        "messagingSenderId": os.environ.get("FIREBASE_MESSAGING_SENDER_ID", ""),
        "appId": os.environ.get("FIREBASE_APP_ID", ""),
        "measurementId": os.environ.get("FIREBASE_MEASUREMENT_ID", "")
    }
    return render_template('login.html', firebase_config=firebase_config)

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

@app.route('/create-scheduler')
def create_scheduler():
    return render_template('create_scheduler.html')

if __name__ == '__main__':
    app.run(debug=True, port=5000)
