from flask import Flask, request, render_template, jsonify
from services.image_service import process_image
from services.claude_service import analyze_document
import os
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Configure upload folder
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# In-memory storage for receipts
receipts_db = []

@app.route('/')
def index(): 
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'Keine Datei ausgewählt'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'Keine Datei ausgewählt'}), 400

        # Process the image
        processed_image_path = process_image(file)
        
        # Analyze the document
        analysis_result = analyze_document(processed_image_path)
        
        return jsonify({
            'success': True,
            'image_path': processed_image_path,
            'analysis': analysis_result
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/receipts', methods=['POST'])
def save_receipt():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Keine Daten erhalten'}), 400
        # Füge Zeitstempel hinzu
        data['created_at'] = datetime.now().isoformat()
        receipts_db.append(data)
        return jsonify({'message': 'Beleg gespeichert', 'stats': calculate_stats()})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/stats')
def get_stats():
    return jsonify(calculate_stats())

@app.route('/health')
def health():
    return jsonify({'status': 'ok'})

def calculate_stats():
    if not receipts_db:
        return {'income': 0, 'expenses': 0, 'total': 0}
    income = sum(r.get('gross_amount', 0) for r in receipts_db if r.get('gross_amount', 0) > 0)
    expenses = sum(abs(r.get('gross_amount', 0)) for r in receipts_db if r.get('gross_amount', 0) < 0)
    total = income - expenses
    return {'income': income, 'expenses': expenses, 'total': total}

if __name__ == '__main__':
    app.run(debug=True)
