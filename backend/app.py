from flask import Flask
from flask_cors import CORS
from config import Config
from models import init_db
from routes.assignments import assignments_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Enable CORS for frontend
    CORS(app, origins=['http://localhost:3000', 'http://127.0.0.1:5500', 'http://localhost:5500', 'http://127.0.0.1:5501', 'http://localhost:5501'])
    
    # Initialize database
    init_db(app)
    
    # Register blueprints
    app.register_blueprint(assignments_bp, url_prefix='/api')
    
    @app.route('/')
    def index():
        return {'message': 'Deadline Tracker API is running!'}
    
    @app.route('/health')
    def health():
        return {'status': 'healthy'}
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)
