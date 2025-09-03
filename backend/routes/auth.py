from flask import Blueprint, request, jsonify, session, current_app
from werkzeug.security import generate_password_hash
from models import User
from email_service import EmailService
import re

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['email', 'password', 'first_name', 'last_name']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        email = data['email'].lower().strip()
        password = data['password']
        first_name = data['first_name'].strip()
        last_name = data['last_name'].strip()
        
        # Validate email format
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, email):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Validate password strength
        if len(password) < 8:
            return jsonify({'error': 'Password must be at least 8 characters long'}), 400
        
        # Create user
        user_id, verification_token = User.create_user(email, password, first_name, last_name)
        
        if user_id is None:
            return jsonify({'error': verification_token}), 400
        
        # Send verification email
        try:
            EmailService.send_verification_email(email, first_name, verification_token)
        except Exception as e:
            # Log the error but don't fail registration
            print(f"Failed to send verification email: {e}")
        
        return jsonify({
            'message': 'User registered successfully! You can now log in.',
            'user_id': user_id
        }), 201
        
    except Exception as e:
        return jsonify({'error': 'Registration failed'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user"""
    try:
        data = request.get_json()
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password are required'}), 400
        
        email = data['email'].lower().strip()
        password = data['password']
        
        # Verify user credentials
        user = User.verify_user(email, password)
        
        if not user:
            return jsonify({'error': 'Invalid email or password'}), 401
        # Email verification is now optional - all users are auto-verified
        # if not user['email_verified']:
        #     print("Email not verified")
        #     return jsonify({'error': 'Please verify your email before logging in'}), 401
        
        # Create session
        session.permanent = True  # Make session permanent
        session['user_id'] = user['id']
        session['user_email'] = user['email']
        session['user_name'] = f"{user['first_name']} {user['last_name']}"
        
        # Force session to be saved
        session.modified = True
        
        # Debug: Print session info
        print(f"🔍 Session created: {session}")
        print(f"🔍 Session user_id: {session.get('user_id')}")
        print(f"🔍 Session modified: {session.modified}")
        
        response = jsonify({
            'message': 'Login successful',
            'user': {
                'id': user['id'],
                'email': user['email'],
                'first_name': user['first_name'],
                'last_name': user['last_name'],
                'name': f"{user['first_name']} {user['last_name']}"
            }
        })
        
        return response, 200
        
    except Exception as e:
        return jsonify({'error': 'Login failed'}), 500

@auth_bp.route('/logout', methods=['POST'])
def logout():
    """Logout user"""
    try:
        session.clear()
        return jsonify({'message': 'Logout successful'}), 200
    except Exception as e:
        return jsonify({'error': 'Logout failed'}), 500

@auth_bp.route('/verify-email/<token>', methods=['GET'])
def verify_email(token):
    """Verify email with token"""
    try:
        if User.verify_email_token(token):
            return jsonify({'message': 'Email verified successfully'}), 200
        else:
            return jsonify({'error': 'Invalid or expired verification token'}), 400
    except Exception as e:
        return jsonify({'error': 'Email verification failed'}), 500

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Send password reset email"""
    try:
        data = request.get_json()
        
        if not data.get('email'):
            return jsonify({'error': 'Email is required'}), 400
        
        email = data['email'].lower().strip()
        
        # Check if user exists
        user = User.get_user_by_email(email)
        if not user:
            return jsonify({'error': 'No account found with this email address'}), 404
        
        # Create reset token
        reset_token = User.create_reset_token(email)
        
        if not reset_token:
            return jsonify({'error': 'Failed to create reset token'}), 500
        
        # Send reset email
        try:
            EmailService.send_password_reset_email(email, user['first_name'], reset_token)
        except Exception as e:
            print(f"Failed to send password reset email: {e}")
            return jsonify({'error': 'Failed to send password reset email'}), 500
        
        return jsonify({'message': 'Password reset email sent successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': 'Password reset request failed'}), 500

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Reset password with token"""
    try:
        data = request.get_json()
        
        if not data.get('token') or not data.get('password'):
            return jsonify({'error': 'Token and new password are required'}), 400
        
        token = data['token']
        password = data['password']
        
        # Validate password strength
        if len(password) < 8:
            return jsonify({'error': 'Password must be at least 8 characters long'}), 400
        
        # Reset password
        if User.reset_password(token, password):
            return jsonify({'message': 'Password reset successfully'}), 200
        else:
            return jsonify({'error': 'Invalid or expired reset token'}), 400
            
    except Exception as e:
        return jsonify({'error': 'Password reset failed'}), 500

@auth_bp.route('/profile', methods=['GET'])
def get_profile():
    """Get current user profile"""
    try:
        user_id = session.get('user_id')
        
        if not user_id:
            return jsonify({'error': 'Not authenticated'}), 401
        
        user = User.get_user_by_id(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({
            'user': {
                'id': user['id'],
                'email': user['email'],
                'first_name': user['first_name'],
                'last_name': user['last_name'],
                'name': f"{user['first_name']} {user['last_name']}",
                'email_verified': user['email_verified']
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get profile'}), 500

@auth_bp.route('/resend-verification', methods=['POST'])
def resend_verification():
    """Resend email verification"""
    try:
        data = request.get_json()
        
        if not data.get('email'):
            return jsonify({'error': 'Email is required'}), 400
        
        email = data['email'].lower().strip()
        
        # Check if user exists and is not verified
        user = User.get_user_by_email(email)
        if not user:
            return jsonify({'error': 'No account found with this email address'}), 404
        
        if user['email_verified']:
            return jsonify({'error': 'Email is already verified'}), 400
        
        # Generate new verification token
        verification_token = User.create_user(email, "temp", user['first_name'], user['last_name'])[1]
        
        # Send verification email
        try:
            EmailService.send_verification_email(email, user['first_name'], verification_token)
        except Exception as e:
            print(f"Failed to send verification email: {e}")
            return jsonify({'error': 'Failed to send verification email'}), 500
        
        return jsonify({'message': 'Verification email sent successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to resend verification'}), 500
