# Deadline Tracker

A full-stack web application for managing assignments and deadlines with a clean, modern interface.

## Features

- **Assignment Management**: Create, read, update, and delete assignments
- **Priority Levels**: Set priority (low, medium, high) for each assignment
- **Status Tracking**: Track assignment status (pending, in-progress, completed)
- **Due Date Management**: Set and track due dates with datetime precision
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Updates**: Instant feedback for all operations

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

## Technology Stack

### Frontend

- **HTML5**: Semantic markup
- **CSS3**: Modern styling with responsive design
- **Vanilla JavaScript**: No frameworks, pure ES6+ JavaScript
- **Fetch API**: For HTTP requests to backend

### Backend

- **Flask**: Python web framework
- **SQLAlchemy**: ORM for database operations
- **SQLite**: Lightweight database (can be changed to PostgreSQL/MySQL)
- **Flask-CORS**: Cross-origin resource sharing support

## Getting Started

### Prerequisites

- Python 3.8 or higher
- Modern web browser
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
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

## Usage

1. **View Assignments**: Open the main page to see all assignments in a table format
2. **Add Assignment**: Click "Add New Assignment" to create a new assignment
3. **Edit Assignment**: Click the "Edit" button on any assignment row
4. **Update Status**: Click "Complete" to mark an assignment as completed
5. **Delete Assignment**: Click "Delete" to remove an assignment

## Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///deadline_tracker.db
```

### Database Configuration

The application uses SQLite by default. To use a different database:

1. Update `DATABASE_URL` in your `.env` file
2. Install the appropriate database driver
3. Update `requirements.txt` if needed

## Development

### Adding New Features

1. Create feature branch: `git checkout -b feature/new-feature`
2. Make your changes
3. Test thoroughly
4. Submit pull request

### Code Style

- Follow PEP 8 for Python code
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please open an issue in the repository.
