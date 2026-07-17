
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
import os
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Enable CORS for all routes
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE"],
        "allow_headers": ["Content-Type"]
    }
})

# MongoDB Configuration
MONGO_URI = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/')

try:
    client = MongoClient(MONGO_URI)
    client.admin.command('ping')
    print("✅ Connected to MongoDB successfully!")
except Exception as e:
    print(f"❌ MongoDB connection failed: {e}")
    exit(1)

db = client['rtsp_overlay_db']
overlays_collection = db['overlays']
settings_collection = db['settings']

# Helper Functions
def serialize_doc(doc):
    """Convert MongoDB document to JSON-serializable dict"""
    if doc:
        doc['_id'] = str(doc['_id'])
    return doc

def validate_overlay_data(data):
    """Validate overlay data structure"""
    required_fields = ['type', 'content', 'position', 'size']
    
    for field in required_fields:
        if field not in data:
            return False, f"Missing required field: {field}"
    
    if data['type'] not in ['text', 'image']:
        return False, "Invalid overlay type. Must be 'text' or 'image'"
    
    if 'x' not in data['position'] or 'y' not in data['position']:
        return False, "Position must include 'x' and 'y' coordinates"
    
    if 'width' not in data['size'] or 'height' not in data['size']:
        return False, "Size must include 'width' and 'height'"
    
    return True, None

# ==================== OVERLAY CRUD ENDPOINTS ====================

@app.route('/api/overlays', methods=['GET'])
def get_overlays():
    """Get all overlays"""
    try:
        overlays = list(overlays_collection.find())
        serialized_overlays = [serialize_doc(overlay) for overlay in overlays]
        print(f"📋 Retrieved {len(serialized_overlays)} overlays")
        return jsonify(serialized_overlays), 200
    except Exception as e:
        print(f"❌ Error getting overlays: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/overlays/<overlay_id>', methods=['GET'])
def get_overlay(overlay_id):
    """Get single overlay by ID"""
    try:
        if not ObjectId.is_valid(overlay_id):
            return jsonify({'error': 'Invalid overlay ID format'}), 400
        
        overlay = overlays_collection.find_one({'_id': ObjectId(overlay_id)})
        
        if overlay:
            print(f"📄 Retrieved overlay: {overlay_id}")
            return jsonify(serialize_doc(overlay)), 200
        else:
            print(f"❌ Overlay not found: {overlay_id}")
            return jsonify({'error': 'Overlay not found'}), 404
    except Exception as e:
        print(f"❌ Error getting overlay: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/overlays', methods=['POST'])
def create_overlay():
    """Create new overlay"""
    try:
        data = request.json
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        is_valid, error_message = validate_overlay_data(data)
        if not is_valid:
            return jsonify({'error': error_message}), 400
        
        data['created_at'] = datetime.utcnow()
        data['updated_at'] = datetime.utcnow()
        
        result = overlays_collection.insert_one(data)
        overlay = overlays_collection.find_one({'_id': result.inserted_id})
        
        print(f"✅ Created overlay: {result.inserted_id} - Type: {data['type']}")
        return jsonify(serialize_doc(overlay)), 201
    except Exception as e:
        print(f"❌ Error creating overlay: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/overlays/<overlay_id>', methods=['PUT'])
def update_overlay(overlay_id):
    """Update existing overlay"""
    try:
        if not ObjectId.is_valid(overlay_id):
            return jsonify({'error': 'Invalid overlay ID format'}), 400
        
        data = request.json
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        data['updated_at'] = datetime.utcnow()
        data.pop('_id', None)
        data.pop('created_at', None)
        
        result = overlays_collection.update_one(
            {'_id': ObjectId(overlay_id)},
            {'$set': data}
        )
        
        if result.matched_count == 0:
            print(f"❌ Overlay not found for update: {overlay_id}")
            return jsonify({'error': 'Overlay not found'}), 404
        
        overlay = overlays_collection.find_one({'_id': ObjectId(overlay_id)})
        print(f"✅ Updated overlay: {overlay_id}")
        return jsonify(serialize_doc(overlay)), 200
    except Exception as e:
        print(f"❌ Error updating overlay: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/overlays/<overlay_id>', methods=['DELETE'])
def delete_overlay(overlay_id):
    """Delete overlay"""
    try:
        if not ObjectId.is_valid(overlay_id):
            return jsonify({'error': 'Invalid overlay ID format'}), 400
        
        result = overlays_collection.delete_one({'_id': ObjectId(overlay_id)})
        
        if result.deleted_count == 0:
            print(f"❌ Overlay not found for deletion: {overlay_id}")
            return jsonify({'error': 'Overlay not found'}), 404
        
        print(f"✅ Deleted overlay: {overlay_id}")
        return jsonify({
            'message': 'Overlay deleted successfully',
            'deleted_id': overlay_id
        }), 200
    except Exception as e:
        print(f"❌ Error deleting overlay: {e}")
        return jsonify({'error': str(e)}), 500

# ==================== SETTINGS ENDPOINTS ====================

@app.route('/api/settings', methods=['GET'])
def get_settings():
    """Get application settings"""
    try:
        settings = settings_collection.find_one({'type': 'app_settings'})
        
        if not settings:
            default_settings = {
                'type': 'app_settings',
                'rtsp_url': '',
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }
            settings_collection.insert_one(default_settings)
            settings = default_settings
            print("✅ Created default settings")
        
        return jsonify(serialize_doc(settings)), 200
    except Exception as e:
        print(f"❌ Error getting settings: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/settings', methods=['PUT'])
def update_settings():
    """Update application settings"""
    try:
        data = request.json
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        data['updated_at'] = datetime.utcnow()
        data['type'] = 'app_settings'
        
        settings_collection.update_one(
            {'type': 'app_settings'},
            {'$set': data},
            upsert=True
        )
        
        settings = settings_collection.find_one({'type': 'app_settings'})
        print(f"✅ Updated settings")
        return jsonify(serialize_doc(settings)), 200
    except Exception as e:
        print(f"❌ Error updating settings: {e}")
        return jsonify({'error': str(e)}), 500

# ==================== STREAM ENDPOINT ====================

@app.route('/api/stream', methods=['POST'])
def start_stream():
    """Configure RTSP stream"""
    try:
        data = request.json
        rtsp_url = data.get('rtsp_url')
        
        if not rtsp_url:
            return jsonify({'error': 'RTSP URL is required'}), 400
        
        settings_collection.update_one(
            {'type': 'app_settings'},
            {
                '$set': {
                    'rtsp_url': rtsp_url,
                    'updated_at': datetime.utcnow()
                }
            },
            upsert=True
        )
        
        print(f"✅ Stream configured: {rtsp_url}")
        
        return jsonify({
            'message': 'Stream configuration saved',
            'rtsp_url': rtsp_url,
            'note': 'Use FFmpeg for RTSP to HLS conversion in production'
        }), 200
    except Exception as e:
        print(f"❌ Error configuring stream: {e}")
        return jsonify({'error': str(e)}), 500

# ==================== HEALTH CHECK ====================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        client.admin.command('ping')
        
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat(),
            'database': 'connected',
            'overlays_count': overlays_collection.count_documents({})
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500

# ==================== ROOT ENDPOINT ====================

@app.route('/', methods=['GET'])
def root():
    """Root endpoint with API information"""
    return jsonify({
        'message': 'RTSP Livestream Overlay API',
        'version': '1.0.0',
        'endpoints': {
            'overlays': '/api/overlays',
            'settings': '/api/settings',
            'stream': '/api/stream',
            'health': '/api/health'
        },
        'documentation': 'See API_DOCUMENTATION.md'
    }), 200

# ==================== ERROR HANDLERS ====================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

# ==================== MAIN ====================

if __name__ == '__main__':
    print("\n" + "="*50)
    print("🚀 RTSP Livestream Overlay API Starting...")
    print("="*50)
    print(f"📡 MongoDB: {MONGO_URI}")
    print(f"🌐 API will run on: http://127.0.0.1:5000")
    print(f"📚 Database: rtsp_overlay_db")
    print("="*50 + "\n")
    
    app.run(
        debug=True,
        host='0.0.0.0',
        port=int(os.environ.get('PORT', 5000))
    )