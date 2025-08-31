from flask import Blueprint, request, jsonify
from datetime import datetime
from models import Assignment

assignments_bp = Blueprint('assignments', __name__)

@assignments_bp.route('/assignments', methods=['GET'])
def get_assignments():
    """Get all assignments"""
    try:
        assignments = Assignment.get_all()
        return jsonify(assignments), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@assignments_bp.route('/assignments/<int:assignment_id>', methods=['GET'])
def get_assignment(assignment_id):
    """Get a specific assignment by ID"""
    try:
        assignment = Assignment.get_by_id(assignment_id)
        if assignment is None:
            return jsonify({'error': 'Assignment not found'}), 404
        return jsonify(assignment), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@assignments_bp.route('/assignments', methods=['POST'])
def create_assignment():
    """Create a new assignment"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('title'):
            return jsonify({'error': 'Title is required'}), 400
        
        if not data.get('due_date'):
            return jsonify({'error': 'Due date is required'}), 400
        
        # Create new assignment
        assignment_id = Assignment.create(data)
        
        # Get the created assignment
        assignment = Assignment.get_by_id(assignment_id)
        
        return jsonify(assignment), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@assignments_bp.route('/assignments/<int:assignment_id>', methods=['PUT'])
def update_assignment(assignment_id):
    """Update an existing assignment"""
    try:
        # Check if assignment exists
        existing_assignment = Assignment.get_by_id(assignment_id)
        if existing_assignment is None:
            return jsonify({'error': 'Assignment not found'}), 404
        
        data = request.get_json()
        
        # Update assignment
        success = Assignment.update(assignment_id, data)
        
        if success:
            # Get the updated assignment
            updated_assignment = Assignment.get_by_id(assignment_id)
            return jsonify(updated_assignment), 200
        else:
            return jsonify({'error': 'No fields to update'}), 400
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@assignments_bp.route('/assignments/<int:assignment_id>', methods=['PATCH'])
def patch_assignment(assignment_id):
    """Partially update an assignment (mainly for status updates)"""
    try:
        # Check if assignment exists
        existing_assignment = Assignment.get_by_id(assignment_id)
        if existing_assignment is None:
            return jsonify({'error': 'Assignment not found'}), 404
        
        data = request.get_json()
        
        # Update assignment
        success = Assignment.update(assignment_id, data)
        
        if success:
            # Get the updated assignment
            updated_assignment = Assignment.get_by_id(assignment_id)
            return jsonify(updated_assignment), 200
        else:
            return jsonify({'error': 'No fields to update'}), 400
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@assignments_bp.route('/assignments/<int:assignment_id>', methods=['DELETE'])
def delete_assignment(assignment_id):
    """Delete an assignment"""
    try:
        # Check if assignment exists
        existing_assignment = Assignment.get_by_id(assignment_id)
        if existing_assignment is None:
            return jsonify({'error': 'Assignment not found'}), 404
        
        # Delete assignment
        success = Assignment.delete(assignment_id)
        
        if success:
            return jsonify({'message': 'Assignment deleted successfully'}), 200
        else:
            return jsonify({'error': 'Failed to delete assignment'}), 500
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
