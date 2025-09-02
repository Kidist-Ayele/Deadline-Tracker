from config import Config
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import threading

def init_mail(app):
    """Initialize email service with the app"""
    # For now, we'll use a simple SMTP setup
    # This can be enhanced later with Flask-Mail
    pass

def send_email(subject, recipients, body, html_body=None, sender_email=None):
    """Send email with the given parameters using SMTP"""
    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        
        # Use provided sender email or default
        from_email = sender_email or Config.MAIL_DEFAULT_SENDER or Config.MAIL_USERNAME
        msg['From'] = from_email
        msg['To'] = ', '.join(recipients)
        
        # Add text and HTML parts
        text_part = MIMEText(body, 'plain')
        msg.attach(text_part)
        
        if html_body:
            html_part = MIMEText(html_body, 'html')
            msg.attach(html_part)
        
        # Send email asynchronously
        thread = threading.Thread(target=send_email_async, args=(msg, recipients))
        thread.start()
        
        return True
    except Exception as e:
        print(f"Failed to create email: {e}")
        return False

def send_email_async(msg, recipients):
    """Send email asynchronously using SMTP"""
    try:
        # Only send if email is configured
        if not Config.MAIL_USERNAME or not Config.MAIL_PASSWORD:
            print(f"Email not configured. Would send: {msg['Subject']} to {recipients}")
            return
        
        # Create SMTP session
        server = smtplib.SMTP(Config.MAIL_SERVER, Config.MAIL_PORT)
        server.starttls()
        server.login(Config.MAIL_USERNAME, Config.MAIL_PASSWORD)
        
        # Send email
        text = msg.as_string()
        server.sendmail(Config.MAIL_DEFAULT_SENDER, recipients, text)
        server.quit()
        
        print(f"Email sent successfully: {msg['Subject']} to {recipients}")
    except Exception as e:
        print(f"Failed to send email: {e}")
        print(f"Email content: {msg['Subject']} to {recipients}")

class EmailService:
    """Email service for various types of notifications"""
    
    @staticmethod
    def send_verification_email(email, first_name, verification_token):
        """Send email verification email"""
        subject = f"Verify your {Config.APP_NAME} account"
        
        verification_url = f"{Config.APP_URL}/api/auth/verify-email/{verification_token}"
        
        body = f"""
        Hello {first_name},
        
        Thank you for registering with {Config.APP_NAME}! Please verify your email address by clicking the link below:
        
        {verification_url}
        
        If you didn't create an account, you can safely ignore this email.
        
        Best regards,
        The {Config.APP_NAME} Team
        """
        
        html_body = f"""
        <html>
        <body>
            <h2>Welcome to {Config.APP_NAME}!</h2>
            <p>Hello {first_name},</p>
            <p>Thank you for registering with {Config.APP_NAME}! Please verify your email address by clicking the button below:</p>
            <p>
                <a href="{verification_url}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                    Verify Email Address
                </a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p><a href="{verification_url}">{verification_url}</a></p>
            <p>If you didn't create an account, you can safely ignore this email.</p>
            <p>Best regards,<br>The {Config.APP_NAME} Team</p>
        </body>
        </html>
        """
        
        return send_email(subject, [email], body, html_body)
    
    @staticmethod
    def send_password_reset_email(email, first_name, reset_token):
        """Send password reset email"""
        subject = f"Reset your {Config.APP_NAME} password"
        
        reset_url = f"{Config.APP_URL}/reset-password?token={reset_token}"
        
        body = f"""
        Hello {first_name},
        
        You requested to reset your password for your {Config.APP_NAME} account. Click the link below to set a new password:
        
        {reset_url}
        
        This link will expire in 24 hours. If you didn't request a password reset, you can safely ignore this email.
        
        Best regards,
        The {Config.APP_NAME} Team
        """
        
        html_body = f"""
        <html>
        <body>
            <h2>Password Reset Request</h2>
            <p>Hello {first_name},</p>
            <p>You requested to reset your password for your {Config.APP_NAME} account. Click the button below to set a new password:</p>
            <p>
                <a href="{reset_url}" style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                    Reset Password
                </a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p><a href="{reset_url}">{reset_url}</a></p>
            <p><strong>This link will expire in 24 hours.</strong></p>
            <p>If you didn't request a password reset, you can safely ignore this email.</p>
            <p>Best regards,<br>The {Config.APP_NAME} Team</p>
        </body>
        </html>
        """
        
        return send_email(subject, [email], body, html_body)
    
    @staticmethod
    def send_deadline_reminder_email(email, first_name, assignment):
        """Send deadline reminder email"""
        subject = f"Deadline Reminder: {assignment['title']}"
        
        due_date = assignment['due_date'].strftime('%B %d, %Y at %I:%M %p') if hasattr(assignment['due_date'], 'strftime') else assignment['due_date']
        
        body = f"""
        Hello {first_name},
        
        This is a reminder that you have an upcoming deadline:
        
        Assignment: {assignment['title']}
        Description: {assignment['description'] or 'No description provided'}
        Due Date: {due_date}
        Priority: {assignment['priority'].title()}
        Status: {assignment['status'].title()}
        
        Please make sure to complete this assignment on time!
        
        Best regards,
        The {Config.APP_NAME} Team
        """
        
        html_body = f"""
        <html>
        <body>
            <h2>Deadline Reminder</h2>
            <p>Hello {first_name},</p>
            <p>This is a reminder that you have an upcoming deadline:</p>
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #dc3545; margin-top: 0;">{assignment['title']}</h3>
                <p><strong>Description:</strong> {assignment['description'] or 'No description provided'}</p>
                <p><strong>Due Date:</strong> {due_date}</p>
                <p><strong>Priority:</strong> <span style="color: {'#dc3545' if assignment['priority'] == 'high' else '#ffc107' if assignment['priority'] == 'medium' else '#28a745'}">{assignment['priority'].title()}</span></p>
                <p><strong>Status:</strong> <span style="color: {'#28a745' if assignment['status'] == 'completed' else '#ffc107' if assignment['status'] == 'in-progress' else '#6c757d'}">{assignment['status'].title()}</span></p>
            </div>
            <p>Please make sure to complete this assignment on time!</p>
            <p>Best regards,<br>The {Config.APP_NAME} Team</p>
        </body>
        </html>
        """
        
        # Use the user's email as sender if no system email is configured
        sender_email = None
        if not Config.MAIL_USERNAME or not Config.MAIL_PASSWORD:
            sender_email = email  # Use user's email as sender
        
        return send_email(subject, [email], body, html_body, sender_email)
    
    @staticmethod
    def send_welcome_email(email, first_name):
        """Send welcome email after email verification"""
        subject = f"Welcome to {Config.APP_NAME}!"
        
        body = f"""
        Hello {first_name},
        
        Welcome to {Config.APP_NAME}! Your email has been verified and your account is now active.
        
        You can now log in to your account and start managing your deadlines and assignments.
        
        If you have any questions or need help, please don't hesitate to contact us.
        
        Best regards,
        The {Config.APP_NAME} Team
        """
        
        html_body = f"""
        <html>
        <body>
            <h2>Welcome to {Config.APP_NAME}!</h2>
            <p>Hello {first_name},</p>
            <p>Welcome to {Config.APP_NAME}! Your email has been verified and your account is now active.</p>
            <p>You can now log in to your account and start managing your deadlines and assignments.</p>
            <p>If you have any questions or need help, please don't hesitate to contact us.</p>
            <p>Best regards,<br>The {Config.APP_NAME} Team</p>
        </body>
        </html>
        """
        
        return send_email(subject, [email], body, html_body)
