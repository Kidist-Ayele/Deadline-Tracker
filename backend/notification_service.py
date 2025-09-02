from datetime import datetime, timedelta
from models import Assignment, EmailNotification
from email_service import EmailService
import threading
import time

class NotificationService:
    """Service for handling assignment notifications"""
    
    @staticmethod
    def check_and_send_daily_reminders():
        """Check for assignments due within 3 days and send email reminders"""
        try:
            print("🔔 Checking for assignments due within 3 days...")
            
            # Get all assignments due within 3 days
            upcoming_assignments = NotificationService.get_assignments_due_within_days(3)
            
            if not upcoming_assignments:
                print("📅 No assignments due within 3 days")
                return
            
            print(f"📧 Found {len(upcoming_assignments)} assignments due within 3 days")
            
            for assignment in upcoming_assignments:
                # Check if we've already sent a notification for this assignment today
                if not NotificationService.has_sent_notification_today(assignment['id']):
                    NotificationService.send_daily_reminder(assignment)
                else:
                    pass  # Already sent notification today
                    
        except Exception as e:
            print(f"❌ Error in daily reminder check: {e}")
            pass  # Silent error handling
    
    @staticmethod
    def get_assignments_due_within_days(days):
        """Get assignments that are due within X days"""
        try:
            from models import get_db
            with get_db() as conn:
                with conn.cursor() as cursor:
                    # Get assignments due within X days
                    now = datetime.now()
                    future_date = now + timedelta(days=days)
                    
                    cursor.execute("""
                        SELECT a.*, u.email, u.first_name, u.last_name
                        FROM assignments a
                        JOIN users u ON a.user_id = u.id
                        WHERE a.due_date >= %s AND a.due_date <= %s
                        AND a.status != 'completed'
                        AND a.email_notification_sent = FALSE
                        ORDER BY a.due_date ASC
                    """, (now, future_date))
                    
                    return cursor.fetchall()
        except Exception as e:
            print(f"❌ Error getting assignments due within {days} days: {e}")
            return []
    
    @staticmethod
    def get_assignments_due_today():
        """Get assignments that are due today"""
        try:
            from models import get_db
            with get_db() as conn:
                with conn.cursor() as cursor:
                    # Get assignments due today (between start and end of today)
                    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
                    today_end = today_start + timedelta(days=1)
                    
                    cursor.execute("""
                        SELECT a.*, u.email, u.first_name, u.last_name
                        FROM assignments a
                        JOIN users u ON a.user_id = u.id
                        WHERE a.due_date >= %s AND a.due_date < %s
                        AND a.status != 'completed'
                        AND a.email_notification_sent = FALSE
                        ORDER BY a.due_date ASC
                    """, (today_start, today_end))
                    
                    return cursor.fetchall()
        except Exception as e:
            return []
    
    @staticmethod
    def has_sent_notification_today(assignment_id):
        """Check if we've already sent a notification for this assignment today"""
        try:
            from models import get_db
            with get_db() as conn:
                with conn.cursor() as cursor:
                    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
                    today_end = today_start + timedelta(days=1)
                    
                    cursor.execute("""
                        SELECT COUNT(*) as count
                        FROM email_notifications
                        WHERE assignment_id = %s
                        AND sent_at >= %s AND sent_at < %s
                        AND status = 'sent'
                    """, (assignment_id, today_start, today_end))
                    
                    result = cursor.fetchone()
                    return result['count'] > 0
        except Exception as e:
            return False
    
    @staticmethod
    def send_daily_reminder(assignment):
        """Send daily reminder email for an assignment"""
        try:
            # Check if email is configured
            from config import Config
            
            # For Postmark, we check if server token is configured
            if not Config.MAIL_PASSWORD:
                # Still record the notification attempt
                try:
                    notification_id = EmailNotification.create_notification(
                        assignment['user_id'],
                        assignment['id'],
                        'daily_reminder',
                        assignment['email'],
                        f"Deadline Reminder: {assignment['title']}",
                        f"Assignment '{assignment['title']}' is due at {assignment['due_date']}"
                    )
                    EmailNotification.mark_sent(notification_id, 'pending', 'Email not configured')
                    return True  # Return True to indicate "processed"
                except Exception as e:
                    return False
            
            # Send email reminder using user's email as recipient
            email_sent = EmailService.send_deadline_reminder_email(
                assignment['email'],  # User's email from registration
                assignment['first_name'],
                assignment
            )
            
            if email_sent:
                # Record the notification
                notification_id = EmailNotification.create_notification(
                    assignment['user_id'],
                    assignment['id'],
                    'daily_reminder',
                    assignment['email'],
                    f"Deadline Reminder: {assignment['title']}",
                    f"Assignment '{assignment['title']}' is due at {assignment['due_date']}"
                )
                
                # Mark notification as sent
                EmailNotification.mark_sent(notification_id, 'sent')
                
                # Mark assignment as notified
                Assignment.mark_notification_sent(assignment['id'])
                
                print(f"✅ Daily reminder sent for assignment {assignment['id']}")
                return True
            else:
                print(f"❌ Failed to send daily reminder for assignment {assignment['id']}")
                return False
                
        except Exception as e:
            print(f"❌ Error sending daily reminder: {e}")
            return False
    
    @staticmethod
    def start_daily_reminder_scheduler():
        """Start the daily reminder scheduler"""
        def scheduler():
            while True:
                try:
                    # Check for reminders every hour
                    NotificationService.check_and_send_daily_reminders()
                    
                    # Sleep for 1 hour
                    time.sleep(3600)  # 3600 seconds = 1 hour
                    
                except Exception as e:
                    print(f"❌ Error in scheduler: {e}")
                    time.sleep(300)  # Sleep for 5 minutes on error
        
        # Start scheduler in a separate thread
        scheduler_thread = threading.Thread(target=scheduler, daemon=True)
        scheduler_thread.start()
        print("🕐 Daily reminder scheduler started")
    
    @staticmethod
    def send_immediate_reminder(assignment_id, user_id):
        """Send immediate reminder for a specific assignment"""
        try:
            print(f"🔍 Starting immediate reminder for assignment {assignment_id}, user {user_id}")
            
            # Get assignment details
            assignment = Assignment.get_assignment_by_id(assignment_id, user_id)
            if not assignment:
                print(f"❌ Assignment {assignment_id} not found")
                return False
            
            print(f"✅ Assignment found: {assignment['title']}")
            
            # Get user details
            from models import User
            user = User.get_user_by_id(user_id)
            if not user:
                print(f"❌ User {user_id} not found")
                return False
            
            print(f"✅ User found: {user['email']}")
            
            # Add user details to assignment
            assignment['email'] = user['email']
            assignment['first_name'] = user['first_name']
            assignment['last_name'] = user['last_name']
            assignment['user_id'] = user_id
            
            print(f"📧 Sending reminder to: {assignment['email']}")
            
            # Send immediate reminder
            result = NotificationService.send_daily_reminder(assignment)
            print(f"📧 Reminder result: {result}")
            return result
            
        except Exception as e:
            print(f"❌ Error sending immediate reminder: {e}")
            import traceback
            traceback.print_exc()
            return False
