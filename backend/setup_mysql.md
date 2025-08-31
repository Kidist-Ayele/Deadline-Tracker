# MySQL Setup Guide for Deadline Tracker

## Prerequisites

- MySQL Server installed and running
- MySQL client tools (mysql command line or MySQL Workbench)

## Step 1: Install MySQL Dependencies

```bash
cd Deadline-Tracker/backend
pip install -r requirements.txt
```

## Step 2: Create Environment Variables

Create a `.env` file in the `backend` directory:

```env
# MySQL Configuration
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=deadline_tracker

# Flask Configuration
SECRET_KEY=your-secret-key-here
```

## Step 3: Set Up MySQL Database

### Option A: Using MySQL Command Line

```bash
# Connect to MySQL as root
mysql -u root -p

# Run the schema file
source ../database/schema.sql

# Run the seed data file
source ../database/seed.sql

# Exit MySQL
exit
```

### Option B: Using MySQL Workbench

1. Open MySQL Workbench
2. Connect to your MySQL server
3. Open and execute `database/schema.sql`
4. Open and execute `database/seed.sql`

## Step 4: Test the Connection

```bash
cd Deadline-Tracker/backend
python app.py
```

## Troubleshooting

### Common Issues:

1. **Connection Error**: Make sure MySQL is running

   ```bash
   # On Windows
   net start mysql

   # On Linux/Mac
   sudo systemctl start mysql
   ```

2. **Access Denied**: Check your MySQL credentials in `.env`

3. **Database Not Found**: Run the schema.sql file first

4. **Port Issues**: Make sure MySQL is running on port 3306 (default)

### MySQL Installation Links:

- **Windows**: Download from https://dev.mysql.com/downloads/installer/
- **macOS**: `brew install mysql`
- **Ubuntu**: `sudo apt install mysql-server`

## Database Management

- **Create Database**: `CREATE DATABASE deadline_tracker;`
- **Drop Database**: `DROP DATABASE deadline_tracker;`
- **Show Tables**: `SHOW TABLES;`
- **Describe Table**: `DESCRIBE assignments;`
