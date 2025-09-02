from flask import Blueprint, request, jsonify, session
from models import Assignment, EmailNotification
from email_service import EmailService
from datetime import datetime, timedelta
import pytz

assignments_bp = Blueprint('assignments', __name__)

def require_auth():
    """Decorator to require authentication"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401
    return user_id

def convert_utc_to_eat(utc_datetime_str):
    """Convert UTC datetime string to EAT datetime string"""
    try:
        if not utc_datetime_str:
            return None
            
        # Handle different datetime formats
        if isinstance(utc_datetime_str, str):
            # Try different formats
            for fmt in ['%Y-%m-%d %H:%M:%S', '%Y-%m-%d %H:%M', '%Y-%m-%d']:
                try:
                    utc_dt = datetime.strptime(utc_datetime_str, fmt)
                    break
                except ValueError:
                    continue
            else:
                # If no format matches, return original
                print(f"Could not parse datetime: {utc_datetime_str}")
                return utc_datetime_str
        else:
            # If it's already a datetime object
            utc_dt = utc_datetime_str
            
        # Make it timezone-aware if it isn't already
        if utc_dt.tzinfo is None:
            utc_dt = pytz.UTC.localize(utc_dt)
        
        # Convert to EAT
        eat_tz = pytz.timezone('Africa/Nairobi')
        eat_dt = utc_dt.astimezone(eat_tz)
        
        # Return in EAT format
        return eat_dt.strftime('%Y-%m-%d %H:%M:%S')
    except Exception as e:
        print(f"Error converting UTC to EAT: {e}")
        # If conversion fails, return original
        return utc_datetime_str

@assignments_bp.route('/assignments', methods=['GET'])
def get_assignments():
    """Get all assignments for the authenticated user"""
    try:
        user_id = require_auth()
        if isinstance(user_id, tuple):  # Error response
            return user_id
        
        assignments = Assignment.get_all_assignments(user_id)
        
        # Convert UTC times to EAT for display
        for assignment in assignments:
            if assignment['due_date']:
                assignment['due_date'] = convert_utc_to_eat(assignment['due_date'])
        
        return jsonify(assignments), 200
    except Exception as e:
        return jsonify({'error': 'Failed to fetch assignments'}), 500

@assignments_bp.route('/assignments/<int:assignment_id>', methods=['GET'])
def get_assignment(assignment_id):
    """Get a specific assignment by ID"""
    try:
        user_id = require_auth()
        if isinstance(user_id, tuple):  # Error response
            return user_id
        
        assignment = Assignment.get_assignment_by_id(assignment_id, user_id)
        if not assignment:
            return jsonify({'error': 'Assignment not found'}), 404
        
        # Convert UTC time to EAT for display
        if assignment['due_date']:
            assignment['due_date'] = convert_utc_to_eat(assignment['due_date'])
        
        return jsonify(assignment), 200
    except Exception as e:
        return jsonify({'error': 'Failed to fetch assignment'}), 500

@assignments_bp.route('/assignments', methods=['POST'])
def create_assignment():
    """Create a new assignment"""
    try:
        user_id = require_auth()
        if isinstance(user_id, tuple):  # Error response
            return user_id
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'due_date']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        title = data['title'].strip()
        description = data.get('description', '').strip()
        due_date = data['due_date']
        priority = data.get('priority', 'medium')
        status = data.get('status', 'pending')
        
        # Convert EAT time to UTC for storage
        # due_date comes as "YYYY-MM-DD HH:MM" from frontend (EAT timezone)
        try:
            # Parse the EAT datetime string
            eat_tz = pytz.timezone('Africa/Nairobi')  # EAT timezone
            local_dt = datetime.strptime(due_date, '%Y-%m-%d %H:%M')
            # Make it timezone-aware in EAT
            local_dt = eat_tz.localize(local_dt)
            # Convert to UTC for storage
            utc_dt = local_dt.astimezone(pytz.UTC)
            due_date_utc = utc_dt.strftime('%Y-%m-%d %H:%M:%S')
        except Exception as e:
            return jsonify({'error': f'Invalid date format: {due_date}. Expected: YYYY-MM-DD HH:MM'}), 400
        
        # Validate priority and status
        valid_priorities = ['low', 'medium', 'high']
        valid_statuses = ['pending', 'in-progress', 'completed']
        
        if priority not in valid_priorities:
            return jsonify({'error': 'Invalid priority value'}), 400
        
        if status not in valid_statuses:
            return jsonify({'error': 'Invalid status value'}), 400
        
        # Create assignment with UTC time
        assignment_id = Assignment.create_assignment(
            user_id, title, description, due_date_utc, priority, status
        )
        
        # Get the created assignment
        assignment = Assignment.get_assignment_by_id(assignment_id, user_id)
        
        return jsonify({
            'message': 'Assignment created successfully',
            'assignment': assignment
        }), 201
        
    except Exception as e:
        return jsonify({'error': 'Failed to create assignment'}), 500

@assignments_bp.route('/assignments/<int:assignment_id>', methods=['PUT'])
def update_assignment(assignment_id):
    """Update an assignment"""
    try:
        user_id = require_auth()
        if isinstance(user_id, tuple):  # Error response
            return user_id
        
        data = request.get_json()
        
        # Check if assignment exists and belongs to user
        existing_assignment = Assignment.get_assignment_by_id(assignment_id, user_id)
        if not existing_assignment:
            return jsonify({'error': 'Assignment not found'}), 404
        
        # Validate required fields
        required_fields = ['title', 'due_date']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        title = data['title'].strip()
        description = data.get('description', '').strip()
        due_date = data['due_date']
        priority = data.get('priority', 'medium')
        status = data.get('status', 'pending')
        
        # Convert EAT time to UTC for storage
        try:
            # Parse the EAT datetime string
            eat_tz = pytz.timezone('Africa/Nairobi')  # EAT timezone
            local_dt = datetime.strptime(due_date, '%Y-%m-%d %H:%M')
            # Make it timezone-aware in EAT
            local_dt = eat_tz.localize(local_dt)
            # Convert to UTC for storage
            utc_dt = local_dt.astimezone(pytz.UTC)
            due_date_utc = utc_dt.strftime('%Y-%m-%d %H:%M:%S')
        except Exception as e:
            return jsonify({'error': f'Invalid date format: {due_date}. Expected: YYYY-MM-DD HH:MM'}), 400
        
        # Validate priority and status
        valid_priorities = ['low', 'medium', 'high']
        valid_statuses = ['pending', 'in-progress', 'completed']
        
        if priority not in valid_priorities:
            return jsonify({'error': 'Invalid priority value'}), 400
        
        if status not in valid_statuses:
            return jsonify({'error': 'Invalid status value'}), 400
        
        # Update assignment with UTC time
        success = Assignment.update_assignment(
            assignment_id, user_id, title, description, due_date_utc, priority, status
        )
        
        if not success:
            return jsonify({'error': 'Failed to update assignment'}), 500
        
        # Get the updated assignment
        assignment = Assignment.get_assignment_by_id(assignment_id, user_id)
        
        return jsonify({
            'message': 'Assignment updated successfully',
            'assignment': assignment
        }), 200
        
    except Exception as e:
        print(f"Error updating assignment: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to update assignment'}), 500

@assignments_bp.route('/assignments/<int:assignment_id>', methods=['PATCH'])
def update_assignment_status(assignment_id):
    """Update assignment status"""
    try:
        user_id = require_auth()
        if isinstance(user_id, tuple):  # Error response
            return user_id
        
        data = request.get_json()
        
        if not data.get('status'):
            return jsonify({'error': 'Status is required'}), 400
        
        status = data['status']
        valid_statuses = ['pending', 'in-progress', 'completed']
        
        if status not in valid_statuses:
            return jsonify({'error': 'Invalid status value'}), 400
        
        # Update status
        success = Assignment.update_status(assignment_id, user_id, status)
        
        if not success:
            return jsonify({'error': 'Assignment not found or update failed'}), 404
        
        # Get the updated assignment
        assignment = Assignment.get_assignment_by_id(assignment_id, user_id)
        
        return jsonify({
            'message': 'Assignment status updated successfully',
            'assignment': assignment
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to update assignment status'}), 500

@assignments_bp.route('/assignments/<int:assignment_id>', methods=['DELETE'])
def delete_assignment(assignment_id):
    """Delete an assignment"""
    try:
        user_id = require_auth()
        if isinstance(user_id, tuple):  # Error response
            return user_id
        
        # Check if assignment exists and belongs to user
        existing_assignment = Assignment.get_assignment_by_id(assignment_id, user_id)
        if not existing_assignment:
            return jsonify({'error': 'Assignment not found'}), 404
        
        # Delete assignment
        success = Assignment.delete_assignment(assignment_id, user_id)
        
        if not success:
            return jsonify({'error': 'Failed to delete assignment'}), 500
        
        return jsonify({'message': 'Assignment deleted successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to delete assignment'}), 500

@assignments_bp.route('/assignments/due-soon', methods=['GET'])
def get_due_assignments():
    """Get assignments that are due soon (for the authenticated user)"""
    try:
        user_id = require_auth()
        if isinstance(user_id, tuple):  # Error response
            return user_id
        
        # Get assignments due in the next 24 hours
        assignments = Assignment.get_due_assignments()
        
        # Filter for current user only
        user_assignments = [a for a in assignments if a['user_id'] == user_id]
        
        return jsonify(user_assignments), 200
    except Exception as e:
        return jsonify({'error': 'Failed to fetch due assignments'}), 500

@assignments_bp.route('/assignments/statistics', methods=['GET'])
def get_assignment_statistics():
    """Get assignment statistics for the authenticated user"""
    try:
        user_id = require_auth()
        if isinstance(user_id, tuple):  # Error response
            return user_id
        
        assignments = Assignment.get_all_assignments(user_id)
        
        # Calculate statistics
        total = len(assignments)
        completed = len([a for a in assignments if a['status'] == 'completed'])
        pending = len([a for a in assignments if a['status'] == 'pending'])
        in_progress = len([a for a in assignments if a['status'] == 'in-progress'])
        
        # Priority breakdown
        high_priority = len([a for a in assignments if a['priority'] == 'high' and a['status'] != 'completed'])
        medium_priority = len([a for a in assignments if a['priority'] == 'medium' and a['status'] != 'completed'])
        low_priority = len([a for a in assignments if a['priority'] == 'low' and a['status'] != 'completed'])
        
        # Overdue assignments (using EAT timezone)
        now = datetime.now()
        overdue = 0
        due_today = 0
        due_week = 0
        due_next_week = 0
        no_due_date = 0
        
        for assignment in assignments:
            if assignment['status'] == 'completed':
                continue
                
            if assignment['due_date']:
                try:
                    # Convert UTC to EAT for comparison
                    due_date_eat = convert_utc_to_eat(assignment['due_date'])
                    due_datetime = datetime.strptime(due_date_eat, '%Y-%m-%d %H:%M:%S')
                    
                    # Check if overdue
                    if due_datetime < now:
                        overdue += 1
                    
                    # Check due date categories
                    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
                    today_end = today_start + timedelta(days=1)
                    week_end = today_start + timedelta(days=7)
                    next_week_end = today_start + timedelta(days=14)
                    
                    if today_start <= due_datetime < today_end:
                        due_today += 1
                    elif today_start <= due_datetime < week_end:
                        due_week += 1
                    elif week_end <= due_datetime < next_week_end:
                        due_next_week += 1
                except Exception as e:
                    # If date parsing fails, skip this assignment for date calculations
                    print(f"Error parsing due_date for assignment {assignment.get('id', 'unknown')}: {e}")
                    continue
            else:
                no_due_date += 1
        
        # Calculate rates
        completion_rate = round((completed / total * 100) if total > 0 else 0, 1)
        ontime_rate = round(((total - overdue) / total * 100) if total > 0 else 0, 1)
        
        statistics = {
            'total': total,
            'completed': completed,
            'pending': pending,
            'in_progress': in_progress,
            'overdue': overdue,
            'high_priority': high_priority,
            'medium_priority': medium_priority,
            'low_priority': low_priority,
            'due_today': due_today,
            'due_week': due_week,
            'due_next_week': due_next_week,
            'no_due_date': no_due_date,
            'completion_rate': completion_rate,
            'ontime_rate': ontime_rate
        }
        
        return jsonify(statistics), 200
    except Exception as e:
        print(f"Error in get_assignment_statistics: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to fetch statistics'}), 500
