import pymysql
import os
import secrets
import string
from datetime import datetime, timedelta
from contextlib import contextmanager
from werkzeug.security import generate_password_hash, check_password_hash
from config import Config

def get_db_connection():
    """Create a MySQL database connection using Railway MySQL URI"""
    # Parse the MySQL URI from config
    mysql_config = Config().get_mysql_config()
    
    if mysql_config:
        return pymysql.connect(
            host=mysql_config['host'],
            port=mysql_config['port'],
            user=mysql_config['user'],
            password=mysql_config['password'],
            database=mysql_config['database'],
            charset='utf8mb4',
            cursorclass=pymysql.cursors.DictCursor
        )
    else:
        # Fallback to environment variables if URI parsing fails
        return pymysql.connect(
            host=os.environ.get('MYSQL_HOST', 'localhost'),
            port=int(os.environ.get('MYSQL_PORT', 3306)),
            user=os.environ.get('MYSQL_USER', 'root'),
            password=os.environ.get('MYSQL_PASSWORD', ''),
            database=os.environ.get('MYSQL_DATABASE', 'deadline_tracker'),
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

def init_db():
    """Initialize the database with tables"""
    with get_db() as conn:
        with conn.cursor() as cursor:
            # Step 1: Create tables from schema.sql
            print("\n🗄️  Step 1: Creating tables from schema.sql...")
            schema_path = os.path.join(os.path.dirname(__file__), '..', 'database', 'schema.sql')
            print(f"📁 Schema file path: {schema_path}")
            
            with open(schema_path, 'r') as f:
                schema = f.read()
                print(f"📄 Schema file content length: {len(schema)} characters")
                
                # Remove comments and split by CREATE TABLE
                lines = schema.split('\n')
                clean_lines = []
                for line in lines:
                    line = line.strip()
                    if line and not line.startswith('--'):
                        clean_lines.append(line)
                
                clean_schema = '\n'.join(clean_lines)
                print(f"🧹 Clean schema length: {len(clean_schema)} characters")
                
                # Split by CREATE TABLE (case insensitive)
                table_statements = []
                current_statement = ""
                
                for line in clean_lines:
                    if line.upper().startswith('CREATE TABLE'):
                        if current_statement:
                            table_statements.append(current_statement.strip())
                        current_statement = line
                    elif line:
                        current_statement += " " + line
                
                if current_statement:
                    table_statements.append(current_statement.strip())
                
                print(f"🔍 Found {len(table_statements)} CREATE TABLE statements")
                
                for i, statement in enumerate(table_statements):
                    print(f"📝 Table Statement {i+1}: {statement[:100]}...")
                    try:
                        cursor.execute(statement)
                        print(f"✅ Executed: {statement[:50]}...")
                    except Exception as e:
                        if 'already exists' in str(e).lower():
                            print(f"⚠️  Table already exists: {statement[:50]}...")
                        else:
                            print(f"❌ Error executing: {statement[:50]}... - {e}")
                            raise
            
            # Step 2: Create indexes
            print("\n🔍 Step 2: Creating indexes...")
            index_statements = [
                "CREATE INDEX idx_users_email ON users(email)",
                "CREATE INDEX idx_users_verification_token ON users(email_verification_token)",
                "CREATE INDEX idx_users_reset_token ON users(reset_password_token)",
                "CREATE INDEX idx_assignments_user_id ON assignments(user_id)",
                "CREATE INDEX idx_assignments_due_date ON assignments(due_date)",
                "CREATE INDEX idx_assignments_status ON assignments(status)",
                "CREATE INDEX idx_assignments_notification_sent ON assignments(email_notification_sent)",
                "CREATE INDEX idx_email_notifications_user_id ON email_notifications(user_id)",
                "CREATE INDEX idx_email_notifications_status ON email_notifications(status)",
                "CREATE INDEX idx_email_notifications_sent_at ON email_notifications(sent_at)"
            ]
            
            for statement in index_statements:
                try:
                    cursor.execute(statement)
                    print(f"✅ Executed: {statement[:50]}...")
                except Exception as e:
                    if any(phrase in str(e).lower() for phrase in [
                        'duplicate key name', 'already exists', 'duplicate entry'
                    ]):
                        print(f"⚠️  Index already exists: {statement[:50]}...")
                    else:
                        print(f"❌ Error executing: {statement[:50]}... - {e}")
                        print(f"   Continuing with next statement...")
                        continue
            
            # Step 3: Add constraints
            print("\n🔒 Step 3: Adding constraints...")
            constraint_statements = [
                "ALTER TABLE assignments ADD CONSTRAINT chk_priority CHECK (priority IN ('low', 'medium', 'high'))",
                "ALTER TABLE assignments ADD CONSTRAINT chk_status CHECK (status IN ('pending', 'in-progress', 'completed'))"
            ]
            
            for statement in constraint_statements:
                try:
                    cursor.execute(statement)
                    print(f"✅ Executed: {statement[:50]}...")
                except Exception as e:
                    if any(phrase in str(e).lower() for phrase in [
                        'already exists', 'duplicate check constraint'
                    ]):
                        print(f"⚠️  Constraint already exists: {statement[:50]}...")
                    else:
                        print(f"❌ Error executing: {statement[:50]}... - {e}")
                        print(f"   Continuing with next statement...")
                        continue
            
            conn.commit()

class User:
    """User model for authentication and user management"""
    
    @staticmethod
    def create_user(email, password, first_name, last_name):
        """Create a new user"""
        with get_db() as conn:
            with conn.cursor() as cursor:
                # Check if user already exists
                cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
                if cursor.fetchone():
                    return None, "User with this email already exists"
                
                # Generate verification token
                verification_token = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(32))
                
                # Hash password
                password_hash = generate_password_hash(password)
                
                # Insert user with email_verified = TRUE (auto-verify all users)
                cursor.execute("""
                    INSERT INTO users (email, password_hash, first_name, last_name, email_verification_token, email_verified)
                    VALUES (%s, %s, %s, %s, %s, TRUE)
                """, (email, password_hash, first_name, last_name, verification_token))
                
                user_id = cursor.lastrowid
                conn.commit()
                
                return user_id, verification_token
    
    @staticmethod
    def get_user_by_email(email):
        """Get user by email"""
        with get_db() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
                return cursor.fetchone()
    
    @staticmethod
    def get_user_by_id(user_id):
        """Get user by ID"""
        with get_db() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
                return cursor.fetchone()
    
    @staticmethod
    def verify_user(email, password):
        """Verify user credentials"""
        print(f"Verifying user: {email}")
        user = User.get_user_by_email(email)
        print(f"User found: {user is not None}")
        if user:
            print(f"User email verified: {user['email_verified']}")
            password_match = check_password_hash(user['password_hash'], password)
            print(f"Password match: {password_match}")
            if password_match:
                return user
        return None
    
    @staticmethod
    def verify_email_token(token):
        """Verify email verification token"""
        with get_db() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    UPDATE users 
                    SET email_verified = TRUE, email_verification_token = NULL 
                    WHERE email_verification_token = %s
                """, (token,))
                conn.commit()
                return cursor.rowcount > 0
    
    @staticmethod
    def create_reset_token(email):
        """Create password reset token"""
        with get_db() as conn:
            with conn.cursor() as cursor:
                reset_token = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(32))
                expires = datetime.now() + timedelta(hours=24)
                
                cursor.execute("""
                    UPDATE users 
                    SET reset_password_token = %s, reset_password_expires = %s 
                    WHERE email = %s
                """, (reset_token, expires, email))
                conn.commit()
                
                return reset_token if cursor.rowcount > 0 else None
    
    @staticmethod
    def reset_password(token, new_password):
        """Reset password using token"""
        with get_db() as conn:
            with conn.cursor() as cursor:
                password_hash = generate_password_hash(new_password)
                cursor.execute("""
                    UPDATE users 
                    SET password_hash = %s, reset_password_token = NULL, reset_password_expires = NULL 
                    WHERE reset_password_token = %s AND reset_password_expires > NOW()
                """, (password_hash, token))
                conn.commit()
                return cursor.rowcount > 0

class Assignment:
    """Assignment model with user association"""
    
    @staticmethod
    def get_all_assignments(user_id=None):
        """Get all assignments, optionally filtered by user"""
        with get_db() as conn:
            with conn.cursor() as cursor:
                if user_id:
                    cursor.execute("""
                        SELECT * FROM assignments 
                        WHERE user_id = %s 
                        ORDER BY due_date ASC
                    """, (user_id,))
                else:
                    cursor.execute("SELECT * FROM assignments ORDER BY due_date ASC")
                return cursor.fetchall()
    
    @staticmethod
    def get_assignment_by_id(assignment_id, user_id=None):
        """Get assignment by ID, optionally filtered by user"""
        with get_db() as conn:
            with conn.cursor() as cursor:
                if user_id:
                    cursor.execute("""
                        SELECT * FROM assignments 
                        WHERE id = %s AND user_id = %s
                    """, (assignment_id, user_id))
                else:
                    cursor.execute("SELECT * FROM assignments WHERE id = %s", (assignment_id,))
                return cursor.fetchone()
    
    @staticmethod
    def create_assignment(user_id, title, description, due_date, priority, status):
        """Create a new assignment"""
        with get_db() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO assignments (user_id, title, description, due_date, priority, status)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (user_id, title, description, due_date, priority, status))
                assignment_id = cursor.lastrowid
                conn.commit()
                return assignment_id
    
    @staticmethod
    def update_assignment(assignment_id, user_id, title, description, due_date, priority, status):
        """Update an assignment"""
        print(f"Updating assignment {assignment_id} for user {user_id}")
        print(f"Data: title={title}, description={description}, due_date={due_date}, priority={priority}, status={status}")
        try:
            with get_db() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("""
                        UPDATE assignments 
                        SET title = %s, description = %s, due_date = %s, priority = %s, status = %s
                        WHERE id = %s AND user_id = %s
                    """, (title, description, due_date, priority, status, assignment_id, user_id))
                    conn.commit()
                    result = cursor.rowcount > 0
                    return result
        except Exception as e:
            raise
    
    @staticmethod
    def update_status(assignment_id, user_id, status):
        """Update assignment status"""
        with get_db() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    UPDATE assignments 
                    SET status = %s 
                    WHERE id = %s AND user_id = %s
                """, (status, assignment_id, user_id))
                conn.commit()
                return cursor.rowcount > 0
    
    @staticmethod
    def delete_assignment(assignment_id, user_id):
        """Delete an assignment"""
        with get_db() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    DELETE FROM assignments 
                    WHERE id = %s AND user_id = %s
                """, (assignment_id, user_id))
                conn.commit()
                return cursor.rowcount > 0
    
    @staticmethod
    def get_due_assignments():
        """Get assignments that are due soon (for email notifications)"""
        with get_db() as conn:
            with conn.cursor() as cursor:
                # Get assignments due in the next 24 hours that haven't been notified
                cursor.execute("""
                    SELECT a.*, u.email, u.first_name, u.last_name
                    FROM assignments a
                    JOIN users u ON a.user_id = u.id
                    WHERE a.due_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 24 HOUR)
                    AND a.email_notification_sent = FALSE
                    AND a.status != 'completed'
                """)
                return cursor.fetchall()
    
    @staticmethod
    def get_assignments_due_today():
        """Get assignments that are due today"""
        with get_db() as conn:
            with conn.cursor() as cursor:
                # Get assignments due today (between start and end of today)
                cursor.execute("""
                    SELECT a.*, u.email, u.first_name, u.last_name
                    FROM assignments a
                    JOIN users u ON a.user_id = u.id
                    WHERE DATE(a.due_date) = CURDATE()
                    AND a.status != 'completed'
                    AND a.email_notification_sent = FALSE
                    ORDER BY a.due_date ASC
                """)
                return cursor.fetchall()
    
    @staticmethod
    def mark_notification_sent(assignment_id):
        """Mark that email notification has been sent for an assignment"""
        with get_db() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    UPDATE assignments 
                    SET email_notification_sent = TRUE, notification_sent_at = NOW()
                    WHERE id = %s
                """, (assignment_id,))
                conn.commit()

class EmailNotification:
    """Email notification model"""
    
    @staticmethod
    def create_notification(user_id, assignment_id, notification_type, email_address, subject, message):
        """Create a new email notification record"""
        with get_db() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO email_notifications 
                    (user_id, assignment_id, notification_type, email_address, subject, message)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (user_id, assignment_id, notification_type, email_address, subject, message))
                notification_id = cursor.lastrowid
                conn.commit()
                return notification_id
    
    @staticmethod
    def mark_sent(notification_id, status='sent', error_message=None):
        """Mark notification as sent"""
        with get_db() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    UPDATE email_notifications 
                    SET status = %s, error_message = %s
                    WHERE id = %s
                """, (status, error_message, notification_id))
                conn.commit()
    
    @staticmethod
    def get_pending_notifications():
        """Get pending email notifications"""
        with get_db() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT * FROM email_notifications 
                    WHERE status = 'pending'
                    ORDER BY sent_at ASC
                """)
                return cursor.fetchall()
