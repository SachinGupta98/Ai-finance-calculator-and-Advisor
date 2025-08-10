import os
import requests
from flask import Flask, request, jsonify, render_template, send_from_directory
from dotenv import load_dotenv

# Load environment variables from a .env file
load_dotenv()

# Tell Flask where to find the static files (CSS, JS)
app = Flask(__name__, static_folder='static', template_folder='templates')

# Get your Gemini API Key from environment variables
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
# It's better to use the model name in the payload, not the URL.
GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"

# --- NEW: ROUTE TO SERVE THE FRONTEND ---
@app.route('/')
def index():
    """Serves the main index.html file."""
    return render_template('index.html')

# --- EXISTING: ROUTE FOR THE GEMINI API ---
@app.route('/api/gemini', methods=['POST'])
def call_gemini():
    """Acts as a secure proxy to the Gemini API."""
    if not GEMINI_API_KEY:
        return jsonify({"error": "Gemini API key is not configured on the server."}), 500

    data = request.get_json()
    prompt = data.get('prompt')

    if not prompt:
        return jsonify({"error": "No prompt provided."}), 400

    payload = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}]
    }
    headers = {'Content-Type': 'application/json'}

    try:
        response = requests.post(GEMINI_API_URL, headers=headers, json=payload)
        response.raise_for_status()
        return jsonify(response.json())
    except requests.exceptions.RequestException as e:
        print(f"Error calling Gemini API: {e}")
        return jsonify({"error": "Failed to communicate with the Gemini API."}), 502

if __name__ == '__main__':
    app.run(debug=True, port=5000)