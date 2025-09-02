#!/usr/bin/env python3
"""
Script to manually verify a user account
"""
import pymysql
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

def verify_user(email):
    """Manually verify a user account"""
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cursor:
                print(f"Verifying user: {email}")
                
                # Update user to verified
                cursor.execute("""
                    UPDATE users 
                    SET email_verified = TRUE, email_verification_token = NULL 
                    WHERE email = %s
                """, (email,))
                
                if cursor.rowcount > 0:
                    conn.commit()
                    print(f"✅ Successfully verified user: {email}")
                    print("You can now login with this account!")
                else:
                    print(f"❌ User not found: {email}")
                    
    except Exception as e:
        print(f"❌ Error verifying user: {e}")

if __name__ == "__main__":
    # Verify the user's email
    verify_user("kidistayele37@gmail.com")


