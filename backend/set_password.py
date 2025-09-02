#!/usr/bin/env python3
"""
Script to set a new password for the user
"""
import pymysql
from config import Config
from werkzeug.security import generate_password_hash

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

def set_new_password():
    """Set a new password for the user"""
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cursor:
                print("Setting new password...")
                
                # Set a new password that meets requirements (8+ characters)
                new_password = 'password123'  # 11 characters
                new_hash = generate_password_hash(new_password)
                
                cursor.execute("""
                    UPDATE users 
                    SET password_hash = %s 
                    WHERE email = %s
                """, (new_hash, 'kidistayele37@gmail.com'))
                
                conn.commit()
                print(f"✅ New password set: '{new_password}'")
                print(f"You can now login with: kidistayele37@gmail.com / {new_password}")
                
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    set_new_password()


