import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from config import Config
import os

class PostmarkEmailService:
    """Postmark email service using SMTP"""
    
    @staticmethod
    def send_email(to_email, subject, message, html_message=None):
        """Send email using Postmark SMTP"""
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = Config.MAIL_DEFAULT_SENDER
            msg['To'] = to_email
            
            # Add text and HTML parts
            text_part = MIMEText(message, 'plain')
            msg.attach(text_part)
            
            if html_message:
                html_part = MIMEText(html_message, 'html')
                msg.attach(html_part)
            
            # Connect to Postmark SMTP server
            server = smtplib.SMTP(Config.MAIL_SERVER, Config.MAIL_PORT)
            server.starttls()
            
            # Login with Postmark credentials
            server.login(Config.MAIL_USERNAME, Config.MAIL_PASSWORD)
            
            # Send email
            server.send_message(msg)
            server.quit()
            
            print(f"✅ Postmark email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            print(f"❌ Postmark email failed: {e}")
            return False
    
    @staticmethod
    def send_deadline_reminder(to_email, first_name, assignment):
        """Send deadline reminder email via Postmark"""
        subject = f"Deadline Reminder: {assignment['title']}"
        
        message = f"""
        Hello {first_name},
        
        This is a reminder that your assignment "{assignment['title']}" is due today at {assignment['due_date']}.
        
        Assignment Details:
        - Title: {assignment['title']}
        - Description: {assignment['description'] or 'No description'}
        - Due Date: {assignment['due_date']}
        - Priority: {assignment['priority']}
        
        Please make sure to complete it on time!
        
        Best regards,
        Deadline Tracker Team
        """
        
        html_message = f"""
        <html>
        <body>
            <h2>Deadline Reminder</h2>
            <p>Hello {first_name},</p>
            <p>This is a reminder that your assignment <strong>"{assignment['title']}"</strong> is due today at {assignment['due_date']}.</p>
            
            <h3>Assignment Details:</h3>
            <ul>
                <li><strong>Title:</strong> {assignment['title']}</li>
                <li><strong>Description:</strong> {assignment['description'] or 'No description'}</li>
                <li><strong>Due Date:</strong> {assignment['due_date']}</li>
                <li><strong>Priority:</strong> {assignment['priority']}</li>
            </ul>
            
            <p>Please make sure to complete it on time!</p>
            
            <p>Best regards,<br>Deadline Tracker Team</p>
        </body>
        </html>
        """
        
        return PostmarkEmailService.send_email(to_email, subject, message, html_message)
    
    @staticmethod
    def test_connection():
        """Test Postmark connection"""
        try:
            server = smtplib.SMTP(Config.MAIL_SERVER, Config.MAIL_PORT)
            server.starttls()
            server.login(Config.MAIL_USERNAME, Config.MAIL_PASSWORD)
            server.quit()
            print("✅ Postmark connection test successful!")
            return True
        except Exception as e:
            print(f"❌ Postmark connection test failed: {e}")
            return False
