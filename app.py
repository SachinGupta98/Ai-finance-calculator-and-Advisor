import os
import requests
from flask import Flask, request, jsonify, render_template, redirect, url_for, flash
from dotenv import load_dotenv
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from flask_bcrypt import Bcrypt

# Load environment variables
load_dotenv()

app = Flask(__name__, static_folder='static', template_folder='templates')

# --- NEW: CONFIGURATION ---
# Secret key is required for session security (keep this secret in production!)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'super-secret-key-change-me')

# Database Configuration (Creates a local file named site.db)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///site.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize Extensions
db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login' # Redirects here if user tries to access protected page

# Gemini Config
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
# Updated to use the model from your curl command
GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"

# --- NEW: USER MODEL ---
class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(20), unique=True, nullable=False)
    password = db.Column(db.String(60), nullable=False)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# --- ROUTES ---

@app.route('/')
@login_required  # <--- PROTECTS THE HOME PAGE
def index():
    """Serves the main app only if logged in."""
    return render_template('index.html', name=current_user.username)

# --- NEW: AUTHENTICATION ROUTES ---

@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        # Check if user exists
        if User.query.filter_by(username=username).first():
            flash('Username already exists. Please choose another.', 'danger')
            return redirect(url_for('register'))
        
        # Hash password and save user
        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
        user = User(username=username, password=hashed_password)
        db.session.add(user)
        db.session.commit()
        
        flash('Account created! You can now log in.', 'success')
        return redirect(url_for('login'))
        
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
        
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        user = User.query.filter_by(username=username).first()
        
        # Check password
        if user and bcrypt.check_password_hash(user.password, password):
            login_user(user)
            return redirect(url_for('index'))
        else:
            flash('Login Unsuccessful. Please check username and password', 'danger')
            
    return render_template('login.html')

@app.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('login'))

# --- EXISTING: API ROUTE ---
@app.route('/api/gemini', methods=['POST'])
@login_required # Optional: Protect the API too
def call_gemini():
    # ... (Keep your existing Gemini code here exactly as it was) ...
    if not GEMINI_API_KEY:
        return jsonify({"error": "Gemini API key is not configured."}), 500

    data = request.get_json()
    prompt = data.get('prompt')

    if not prompt:
        return jsonify({"error": "No prompt provided."}), 400

    payload = {"contents": [{"role": "user", "parts": [{"text": prompt}]}]}
    headers = {'Content-Type': 'application/json'}

    try:
        response = requests.post(GEMINI_API_URL, headers=headers, json=payload)
        response.raise_for_status()
        return jsonify(response.json())
    except requests.exceptions.RequestException as e:
        return jsonify({"error": "Failed to communicate with Gemini."}), 502

if __name__ == '__main__':
    with app.app_context():
        db.create_all() # Creates the database file if it doesn't exist
    app.run(debug=True, port=5000)
