#!/usr/bin/env python3
"""
Test script to verify email notifications are working
"""

from notification_service import NotificationService
from datetime import datetime

def test_notification_system():
    print("🧪 Testing Email Notification System")
    print("=" * 50)
    
    # Test 1: Check assignments due within 3 days
    print("\n1️⃣ Testing: Get assignments due within 3 days")
    try:
        upcoming = NotificationService.get_assignments_due_within_days(3)
        print(f"✅ Found {len(upcoming)} assignments due within 3 days")
        
        if upcoming:
            for assignment in upcoming:
                print(f"   📅 {assignment['title']} - Due: {assignment['due_date']}")
        else:
            print("   📭 No assignments due within 3 days")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 2: Check assignments due today
    print("\n2️⃣ Testing: Get assignments due today")
    try:
        today = NotificationService.get_assignments_due_today()
        print(f"✅ Found {len(today)} assignments due today")
        
        if today:
            for assignment in today:
                print(f"   📅 {assignment['title']} - Due: {assignment['due_date']}")
        else:
            print("   📭 No assignments due today")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 3: Test the main notification function
    print("\n3️⃣ Testing: Main notification check function")
    try:
        NotificationService.check_and_send_daily_reminders()
        print("✅ Notification check completed successfully")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print("\n" + "=" * 50)
    print("🏁 Test completed!")

if __name__ == "__main__":
    test_notification_system()
