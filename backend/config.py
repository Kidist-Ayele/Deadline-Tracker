import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    
    # MySQL Configuration - Railway MySQL
    MYSQL_URI = os.environ.get('MYSQL_URI') or 'mysql://root:tyneagTqaGciWjfHkxNBUAIoNPeQETjk@shuttle.proxy.rlwy.net:44955/railway'
    
    # Parse MySQL URI for individual components (if needed)
    def get_mysql_config(self):
        """Parse MySQL URI to get individual connection parameters"""
        if self.MYSQL_URI.startswith('mysql://'):
            # Remove mysql:// prefix
            uri = self.MYSQL_URI[8:]
            # Split by @ to separate credentials from host
            credentials, host_db = uri.split('@')
            user, password = credentials.split(':')
            # Split host_db by / to separate host:port from database
            host_port, database = host_db.split('/')
            if ':' in host_port:
                host, port = host_port.split(':')
                port = int(port)
            else:
                host = host_port
                port = 3306
            return {
                'host': host,
                'port': port,
                'user': user,
                'password': password,
                'database': database
            }
        return None
    
    # Email Configuration
    MAIL_SERVER = os.environ.get('MAIL_SERVER') or 'smtp.gmail.com'
    MAIL_PORT = int(os.environ.get('MAIL_PORT') or 587)
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS', 'true').lower() == 'true'
    MAIL_USE_SSL = os.environ.get('MAIL_USE_SSL', 'false').lower() == 'true'
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME') or 'deadline.tracker.app@gmail.com'  # Default sender
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD') or ''  # App password required
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_DEFAULT_SENDER') or 'deadline.tracker.app@gmail.com'
    
    # Application Settings
    APP_NAME = 'Deadline Tracker'
    APP_URL = os.environ.get('APP_URL') or 'http://localhost:5000'
