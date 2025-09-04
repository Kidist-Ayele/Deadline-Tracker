# Deadline Tracker

> A full-stack web application for managing academic deadlines and assignments with cross-device synchronization, built with Flask backend and modern frontend technologies.

## Features

- **Assignment Management**: Create, read, update, and delete assignments
- **Priority Levels**: Set priority (low, medium, high) for each assignment
- **Status Tracking**: Track assignment status (pending, in-progress, completed)
- **Due Date Management**: Set and track due dates with datetime precision
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Updates**: Instant feedback for all operations
- **📧 Email Notifications**: Get reminded about upcoming deadlines

## Screenshots

### Landing Page

### Authentication Pages

### Dashboard

## Project Structure

```
deadline-tracker/
│── frontend/                # All frontend files
│   ├── index.html           # Main page (table of assignments)
│   ├── add.html             # Page to add new assignments
│   ├── css/                 # Styles
│   │   └── style.css
│   ├── js/                  # Scripts
│   │   ├── main.js          # Handles table + fetching data
│   │   └── add.js           # Handles adding assignments
│   └── assets/              # Images, icons, etc.
│
│── backend/                 # Flask backend
│   ├── app.py               # Main Flask app
│   ├── requirements.txt     # Python dependencies
│   ├── config.py            # Database config
│   ├── models.py            # DB models / queries
│   ├── routes/              # API routes
│   │   ├── __init__.py
│   │   └── assignments.py   # CRUD endpoints
│   ├── templates/           # Flask HTML (if needed, else just API)
│   └── static/              # Flask static files (optional, if serving frontend from backend)
│
│── database/
│   ├── schema.sql           # SQL script to create tables
│   └── seed.sql             # Initial test data
│
│── README.md                # Project documentation
```

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Kidist-Ayele/Deadline-Tracker.git
   cd Deadline-Tracker
   ```

2. **Set up the backend**

   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Run the Flask application**

   ```bash
   python app.py
   ```

   The backend will be available at `http://localhost:5000`

4. **Open the frontend**
   - Navigate to the `frontend` directory
   - Open `index.html` in your web browser
   - Or serve it using a local server (recommended):
     ```bash
     # Using Python
     cd frontend
     python -m http.server 8000
     ```
     Then visit `http://localhost:8000`

### Database Setup

The application uses SQLite by default. The database will be automatically created when you first run the application.

To use the provided seed data:

```bash
cd backend
sqlite3 deadline_tracker.db < ../database/schema.sql
sqlite3 deadline_tracker.db < ../database/seed.sql
```

## API Endpoints

### Assignments

- `GET /api/assignments` - Get all assignments
- `GET /api/assignments/<id>` - Get specific assignment
- `POST /api/assignments` - Create new assignment
- `PUT /api/assignments/<id>` - Update assignment
- `PATCH /api/assignments/<id>` - Partially update assignment
- `DELETE /api/assignments/<id>` - Delete assignment

### Assignment Data Structure

```json
{
  "id": 1,
  "title": "Assignment Title",
  "description": "Assignment description",
  "due_date": "2024-01-15T17:00:00",
  "priority": "high",
  "status": "pending",
  "created_at": "2024-01-01T10:00:00",
  "updated_at": "2024-01-01T10:00:00"
}
```

## Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///deadline_tracker.db
```
