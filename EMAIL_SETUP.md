# Email Notification Setup Guide

## Current Status

The notification system is working! Here's what's happening:

✅ **Browser Notifications**: Working perfectly - you'll see notifications when assignments are due
✅ **In-App Notifications**: Working - toast notifications appear in the app
✅ **Email Notifications**: Ready to use! Uses user's email from registration

## How Email Notifications Work

### Automatic User Email Usage

- **User Registration**: When users register, their email is stored in the database
- **Notification Recipients**: All email notifications are sent to the user's registered email address
- **No Manual Configuration**: Users don't need to configure anything - their email is automatically used

### System Email Setup (Optional)

To enable email notifications, you only need to set up the system email sender:

1. **Create a `.env` file** in the `backend` folder with the following content:

```env
# Database Configuration
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=deadline_tracker

# Email Configuration (Optional - for system sender)
MAIL_PASSWORD=your_gmail_app_password

# Application Settings
APP_URL=http://localhost:5000
SECRET_KEY=your-secret-key-here
```

2. **Get Gmail App Password** (Optional):

   - Go to your Google Account settings
   - Enable 2-factor authentication
   - Generate an "App Password" for this application
   - Use that password in `MAIL_PASSWORD`

3. **Restart the Flask server** after creating the `.env` file

### What Happens Without Email Setup

If you don't set up the system email:

- ✅ Browser notifications still work perfectly
- ✅ In-app notifications still work perfectly
- ✅ Visual indicators in the table still work
- ⚠️ Email notifications will show "not configured" message

## Testing Notifications

1. **Browser Notifications**: Click the 🔔 button to test
2. **Email Notifications**: Click the 📧 button to test
   - If configured: Will send email to user's registered email
   - If not configured: Will show "not configured" message

## Current Features Working

- ✅ Assignment due date tracking
- ✅ Visual indicators (overdue = red, urgent = orange, soon = yellow)
- ✅ Browser notifications for assignments due within 30 minutes
- ✅ In-app toast notifications
- ✅ Notification settings modal
- ✅ Automatic checking every minute for due assignments
- ✅ User email automatically used for notifications

## User Experience

1. **Registration**: User provides their email during registration
2. **Automatic Notifications**: System automatically sends notifications to their email
3. **No Configuration Needed**: Users don't need to set up anything
4. **Multiple Users**: Each user gets notifications sent to their own email address

The system is now much simpler and more user-friendly!
