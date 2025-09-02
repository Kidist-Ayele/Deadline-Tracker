from flask import Blueprint, request, jsonify, session
from models import Assignment, EmailNotification
from notification_service import NotificationService
from datetime import datetime

notifications_bp = Blueprint('notifications', __name__)

def require_auth():
    """Decorator to require authentication"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401
    return user_id

@notifications_bp.route('/notifications/test', methods=['POST'])
def test_notification():
    """Test notification for a specific assignment"""
    try:
        user_id = require_auth()
        if isinstance(user_id, tuple):  # Error response
            return user_id
        
        data = request.get_json()
        assignment_id = data.get('assignment_id')
        
        if not assignment_id:
            return jsonify({'error': 'Assignment ID is required'}), 400
        
        # Check if assignment exists and belongs to user
        assignment = Assignment.get_assignment_by_id(assignment_id, user_id)
        if not assignment:
            return jsonify({'error': 'Assignment not found'}), 404
        
        # Send immediate reminder
        success = NotificationService.send_immediate_reminder(assignment_id, user_id)
        
        if success:
            # Check if email is configured
            from config import Config
            if not Config.MAIL_PASSWORD:
                return jsonify({
                    'message': 'Test notification processed (email not configured)',
                    'assignment_id': assignment_id,
                    'note': 'Email service is not configured. Browser notifications are still working. To enable email notifications, set MAIL_PASSWORD in .env file.'
                }), 200
            else:
                return jsonify({
                    'message': 'Test notification sent successfully',
                    'assignment_id': assignment_id
                }), 200
        else:
            return jsonify({'error': 'Failed to send test notification'}), 500
            
    except Exception as e:
        return jsonify({'error': 'Failed to send test notification'}), 500

@notifications_bp.route('/notifications/check-today', methods=['GET'])
def check_today_notifications():
    """Check for assignments due today and send notifications"""
    try:
        user_id = require_auth()
        if isinstance(user_id, tuple):  # Error response
            return user_id
        
        # Get assignments due today for this user
        today_assignments = Assignment.get_assignments_due_today()
        user_assignments = [a for a in today_assignments if a['user_id'] == user_id]
        
        if not user_assignments:
            return jsonify({
                'message': 'No assignments due today',
                'assignments': []
            }), 200
        
        # Send notifications for each assignment
        sent_notifications = []
        for assignment in user_assignments:
            if not NotificationService.has_sent_notification_today(assignment['id']):
                success = NotificationService.send_daily_reminder(assignment)
                if success:
                    sent_notifications.append({
                        'assignment_id': assignment['id'],
                        'title': assignment['title'],
                        'due_date': assignment['due_date']
                    })
        
        return jsonify({
            'message': f'Processed {len(user_assignments)} assignments due today',
            'sent_notifications': sent_notifications,
            'total_assignments': len(user_assignments)
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to check today notifications'}), 500

@notifications_bp.route('/notifications/history', methods=['GET'])
def get_notification_history():
    """Get notification history for the authenticated user"""
    try:
        user_id = require_auth()
        if isinstance(user_id, tuple):  # Error response
            return user_id
        
        # Get notification history for this user
        from models import get_db
        with get_db() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT en.*, a.title as assignment_title
                    FROM email_notifications en
                    LEFT JOIN assignments a ON en.assignment_id = a.id
                    WHERE en.user_id = %s
                    ORDER BY en.sent_at DESC
                    LIMIT 50
                """, (user_id,))
                
                notifications = cursor.fetchall()
                
                # Format the notifications
                formatted_notifications = []
                for notification in notifications:
                    formatted_notifications.append({
                        'id': notification['id'],
                        'type': notification['notification_type'],
                        'subject': notification['subject'],
                        'message': notification['message'],
                        'status': notification['status'],
                        'sent_at': notification['sent_at'].isoformat() if notification['sent_at'] else None,
                        'assignment_title': notification['assignment_title'],
                        'error_message': notification['error_message']
                    })
                
                return jsonify({
                    'notifications': formatted_notifications,
                    'total': len(formatted_notifications)
                }), 200
                
    except Exception as e:
        return jsonify({'error': 'Failed to get notification history'}), 500

@notifications_bp.route('/notifications/settings', methods=['GET'])
def get_notification_settings():
    """Get notification settings for the authenticated user"""
    try:
        user_id = require_auth()
        if isinstance(user_id, tuple):  # Error response
            return user_id
        
        # For now, return default settings
        # In a real app, you'd store these in the database
        settings = {
            'email_notifications': True,
            'daily_reminders': True,
            'reminder_time': '09:00',  # 9 AM
            'timezone': 'EAT'
        }
        
        return jsonify(settings), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get notification settings'}), 500

@notifications_bp.route('/notifications/settings', methods=['PUT'])
def update_notification_settings():
    """Update notification settings for the authenticated user"""
    try:
        user_id = require_auth()
        if isinstance(user_id, tuple):  # Error response
            return user_id
        
        data = request.get_json()
        
        # Validate settings
        email_notifications = data.get('email_notifications', True)
        daily_reminders = data.get('daily_reminders', True)
        reminder_time = data.get('reminder_time', '09:00')
        timezone = data.get('timezone', 'EAT')
        
        # In a real app, you'd save these to the database
        # For now, just return success
        settings = {
            'email_notifications': email_notifications,
            'daily_reminders': daily_reminders,
            'reminder_time': reminder_time,
            'timezone': timezone
        }
        
        return jsonify({
            'message': 'Notification settings updated successfully',
            'settings': settings
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to update notification settings'}), 500
