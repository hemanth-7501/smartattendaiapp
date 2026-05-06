from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
import os
from config import config

db = SQLAlchemy()
jwt = JWTManager()

def create_app(config_name=None):
    """Application factory"""
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')
    
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    # Register blueprints
    with app.app_context():
        from app.routes import auth_bp, attendance_bp, user_bp, parent_bp, report_bp, student_bp
        
        app.register_blueprint(auth_bp, url_prefix='/api/auth')
        app.register_blueprint(attendance_bp, url_prefix='/api/attendance')
        app.register_blueprint(user_bp, url_prefix='/api/users')
        app.register_blueprint(parent_bp, url_prefix='/api/parents')
        app.register_blueprint(report_bp, url_prefix='/api/reports')
        app.register_blueprint(student_bp, url_prefix='/api/students')
        
        # Create tables
        db.create_all()
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return {'error': 'Resource not found'}, 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return {'error': 'Internal server error'}, 500
    
    return app
