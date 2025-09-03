from flask import Flask, jsonify
from flask_cors import CORS
from routes.assignments import assignments_bp
from routes.auth import auth_bp
from routes.notifications import notifications_bp
from models import init_db
from email_service import init_mail
from config import Config
import os

app = Flask(__name__)

# Configure app
app.config['SECRET_KEY'] = Config.SECRET_KEY
app.config['SESSION_COOKIE_SECURE'] = False  # Set to True in production with HTTPS
app.config['SESSION_COOKIE_HTTPONLY'] = False  # Allow JavaScript access for debugging
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_DOMAIN'] = None  # Allow any domain
app.config['SESSION_COOKIE_PATH'] = '/'
app.config['PERMANENT_SESSION_LIFETIME'] = 3600  # 1 hour

# Initialize CORS
CORS(app, 
     origins=['http://localhost:3000', 'http://127.0.0.1:5500', 'http://localhost:5500', 'http://127.0.0.1:5501', 'http://localhost:5501', 'http://localhost:5502', 'http://127.0.0.1:5502', 'file://'], 
     supports_credentials=True, 
     allow_headers=['Content-Type', 'Authorization', 'Cookie'], 
     expose_headers=['Set-Cookie'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'])

# Initialize database
init_db()

# Initialize email service
init_mail(app)

# Start notification scheduler
from notification_service import NotificationService
NotificationService.start_daily_reminder_scheduler()

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(assignments_bp, url_prefix='/api')
app.register_blueprint(notifications_bp, url_prefix='/api')

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'Deadline Tracker API is running',
        'version': '1.0.0'
    }), 200

@app.route('/api/session-test', methods=['GET'])
def session_test():
    """Test session functionality"""
    from flask import session, request
    
    # Debug: Print request info
    print(f"🔍 Session test - Request cookies: {request.cookies}")
    print(f"🔍 Session test - Session: {session}")
    print(f"🔍 Session test - Session keys: {list(session.keys())}")
    
    # Set a test session value
    session['test_value'] = 'test_session_working'
    session.modified = True
    
    return jsonify({
        'message': 'Session test',
        'session_keys': list(session.keys()),
        'test_value': session.get('test_value'),
        'cookies_received': list(request.cookies.keys())
    }), 200

@app.route('/api', methods=['GET'])
def api_info():
    """API information endpoint"""
    return jsonify({
        'name': 'Deadline Tracker API',
        'version': '1.0.0',
        'description': 'A RESTful API for managing deadlines and assignments with user authentication and email notifications',
        'endpoints': {
            'auth': {
                'register': 'POST /api/auth/register',
                'login': 'POST /api/auth/login',
                'logout': 'POST /api/auth/logout',
                'verify_email': 'GET /api/auth/verify-email/<token>',
                'forgot_password': 'POST /api/auth/forgot-password',
                'reset_password': 'POST /api/auth/reset-password',
                'profile': 'GET /api/auth/profile',
                'resend_verification': 'POST /api/auth/resend-verification'
            },
            'assignments': {
                'get_all': 'GET /api/assignments',
                'get_one': 'GET /api/assignments/<id>',
                'create': 'POST /api/assignments',
                'update': 'PUT /api/assignments/<id>',
                'update_status': 'PATCH /api/assignments/<id>',
                'delete': 'DELETE /api/assignments/<id>',
                'due_soon': 'GET /api/assignments/due-soon',
                'statistics': 'GET /api/assignments/statistics'
            }
        }
    }), 200

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
