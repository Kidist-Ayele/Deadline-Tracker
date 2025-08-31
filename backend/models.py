import pymysql
import os
from datetime import datetime
from contextlib import contextmanager
from config import Config

def get_db_connection():
    """Create a MySQL database connection"""
    return pymysql.connect(
        host=Config.MYSQL_HOST,
        port=Config.MYSQL_PORT,
        user=Config.MYSQL_USER,
        password=Config.MYSQL_PASSWORD,
        database=Config.MYSQL_DATABASE,
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor
    )

@contextmanager
def get_db():
    """Context manager for database connections"""
    conn = get_db_connection()
    try:
        yield conn
    finally:
        conn.close()

def init_db(app):
    """Initialize the database with tables"""
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Create assignments table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS assignments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(200) NOT NULL,
                description TEXT,
                due_date DATETIME NOT NULL,
                priority VARCHAR(20) NOT NULL DEFAULT 'medium',
                status VARCHAR(20) NOT NULL DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ''')
        
        # Create indexes for better performance
        try:
            cursor.execute('CREATE INDEX idx_assignments_due_date ON assignments(due_date)')
        except:
            pass  # Index might already exist
        try:
            cursor.execute('CREATE INDEX idx_assignments_status ON assignments(status)')
        except:
            pass  # Index might already exist
        try:
            cursor.execute('CREATE INDEX idx_assignments_priority ON assignments(priority)')
        except:
            pass  # Index might already exist
        
        conn.commit()

class Assignment:
    """Assignment model class"""
    
    @staticmethod
    def get_all():
        """Get all assignments ordered by due date"""
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT * FROM assignments 
                ORDER BY due_date ASC
            ''')
            return cursor.fetchall()
    
    @staticmethod
    def get_by_id(assignment_id):
        """Get assignment by ID"""
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM assignments WHERE id = %s', (assignment_id,))
            return cursor.fetchone()
    
    @staticmethod
    def create(data):
        """Create a new assignment"""
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO assignments (title, description, due_date, priority, status)
                VALUES (%s, %s, %s, %s, %s)
            ''', (
                data['title'],
                data.get('description', ''),
                data['due_date'],
                data.get('priority', 'medium'),
                data.get('status', 'pending')
            ))
            conn.commit()
            return cursor.lastrowid
    
    @staticmethod
    def update(assignment_id, data):
        """Update an assignment"""
        with get_db() as conn:
            cursor = conn.cursor()
            
            # Build update query dynamically
            update_fields = []
            values = []
            
            if 'title' in data:
                update_fields.append('title = %s')
                values.append(data['title'])
            
            if 'description' in data:
                update_fields.append('description = %s')
                values.append(data['description'])
            
            if 'due_date' in data:
                update_fields.append('due_date = %s')
                values.append(data['due_date'])
            
            if 'priority' in data:
                update_fields.append('priority = %s')
                values.append(data['priority'])
            
            if 'status' in data:
                update_fields.append('status = %s')
                values.append(data['status'])
            
            values.append(assignment_id)
            
            if update_fields:
                query = f'''
                    UPDATE assignments 
                    SET {', '.join(update_fields)}
                    WHERE id = %s
                '''
                cursor.execute(query, values)
                conn.commit()
                return True
            return False
    
    @staticmethod
    def delete(assignment_id):
        """Delete an assignment"""
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('DELETE FROM assignments WHERE id = %s', (assignment_id,))
            conn.commit()
            return cursor.rowcount > 0
    
    @staticmethod
    def to_dict(row):
        """Convert database row to dictionary"""
        if isinstance(row, dict):
            return row
        return dict(row) if row else None
