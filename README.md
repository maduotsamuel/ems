# WorkforcePro Employee Management System

A full-stack employee management system with PHP backend and responsive frontend built with HTML, CSS, and JavaScript.

**NEW:** This project now includes a complete PHP backend with proper MVC architecture, RESTful API, and MySQL database integration!

## Main features

- ✅ Role-based login for HR, department director, and employee
- ✅ Dashboard with workforce statistics
- ✅ Employee management (CRUD operations)
- ✅ **NEW: Auto-user creation when adding employees**
- ✅ **NEW: Secure password hashing with bcrypt**
- ✅ **NEW: Password change functionality in user profiles**
- ✅ Attendance check-in and check-out with edit capability
- ✅ Leave request, approval, rejection, and cancellation
- ✅ Payroll calculations and export
- ✅ Performance reviews and rankings
- ✅ Department management
- ✅ Employee profile management
- ✅ RESTful PHP API backend
- ✅ Proper MVC architecture
- ✅ MySQL database integration
- ✅ User authentication with sessions
- ✅ Responsive mobile layout
- ✅ Light and dark mode
- ✅ Data persistence (database or localStorage)

## Demo Login

Password for every account: `Welcome@123`

- HR: `hr@workforcepro.com`
- Director: `director@workforcepro.com`
- Employee: `employee@workforcepro.com`

**Note:** After database setup, these accounts are automatically created. For production, change passwords immediately!

## Auto-User Creation Feature (NEW)

WorkforcePro now automatically creates login credentials when HR adds a new employee:

- ✅ Employee added → User account created automatically
- ✅ Default password provided: `Welcome@123` (bcrypt hashed)
- ✅ Employee can change password on first login
- ✅ Secure password management with strength requirements
- ✅ HR can reset passwords if needed

See [AUTO_USER_CREATION.md](AUTO_USER_CREATION.md) for detailed documentation.

## Running the system

### Option 1: PHP Backend (Recommended) ⭐

This system now comes with a complete PHP backend. 

**Prerequisites:**
- PHP 7.4+
- MySQL
- WAMP/LAMP/XAMPP

**Setup:**
1. Import the database: See [DATABASE_SETUP.md](DATABASE_SETUP.md)
2. Configure .env file (copy from .env.example)
3. Access via: `http://localhost/emm/`

For detailed PHP setup: See [PHP_PROJECT_SETUP.md](PHP_PROJECT_SETUP.md)

### Option 2: Frontend Only (Demo)

Open `index.html` directly in a browser or via Live Server.

**Note:** This uses localStorage (browser storage) and no backend.

## Database Setup (NEW)

This system now includes a complete MySQL database schema and PHP backend API!

### Quick Start:
1. See [DATABASE_SETUP.md](DATABASE_SETUP.md) for detailed database instructions
2. Import `database.sql` into your MySQL server via phpMyAdmin
3. Update `.env` with your database credentials
4. Visit `http://localhost/emm/`

### What's Included:
- ✅ `database.sql` - Complete MySQL schema with 10 tables
- ✅ `src/controllers/` - PHP controllers for all features
- ✅ `src/models/` - Database models
- ✅ `src/config/` - Database configuration and setup
- ✅ `public/index.php` - RESTful API entry point
- ✅ `public/app-api.js` - Frontend API client

### Available Documentation:
- [DATABASE_SETUP.md](DATABASE_SETUP.md) - Database import and configuration
- [PHP_PROJECT_SETUP.md](PHP_PROJECT_SETUP.md) - Backend architecture and API
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Developer quick reference

## Project Structure

```
emm/
├── public/
│   ├── index.php          # API entry point
│   ├── index.html         # Frontend
│   ├── app.js             # Original localStorage version
│   ├── app-api.js         # NEW: API-based version
│   └── styles.css
├── src/
│   ├── config/            # Configuration & database
│   ├── controllers/       # API controllers
│   ├── models/            # Database models
│   ├── middleware/        # Auth & CORS
│   └── Router.php         # Request routing
├── database.sql           # Database schema
├── .env.example           # Environment template
├── .htaccess              # URL rewriting
└── composer.json          # PHP dependencies
```

## localStorage vs Database

**Current Status**: Both modes supported!

- **localStorage** (app.js): Demo mode, runs in browser only
- **Database** (app-api.js): Production mode with backend

## Important - Production Setup

For production use:
- ✅ Set up the MySQL database (see DATABASE_SETUP.md)
- ✅ Configure PHP environment (see PHP_PROJECT_SETUP.md)
- ✅ Hash all passwords with bcrypt (currently using plain text for demo)
- ✅ Implement CSRF protection for forms
- ✅ Enable HTTPS for all communications
- ✅ Set up regular database backups
- ✅ Configure proper error logging
- ✅ Implement rate limiting on API
- ✅ Add comprehensive input validation
- ✅ Set up monitoring and alerting

## Technology Stack

### Backend
- PHP 7.4+
- MySQL 5.7+
- RESTful API architecture

### Frontend
- HTML5
- CSS3 (with responsive design)
- Vanilla JavaScript (no frameworks)

### Tools & Libraries
- Composer (PHP dependency manager)
- WAMP/LAMP (Local development server)
- phpMyAdmin (Database management)

## API Documentation

The system provides a RESTful API for all operations:

**Authentication:**
- POST `/emm/api/auth/login` - User login

**Employees:**
- GET `/emm/api/employees` - List employees
- GET `/emm/api/employees/:id` - Get single employee
- POST `/emm/api/employees` - Create employee
- PUT `/emm/api/employees/:id` - Update employee
- DELETE `/emm/api/employees/:id` - Delete employee

**Attendance:**
- GET `/emm/api/attendance?date=YYYY-MM-DD` - Get attendance
- POST `/emm/api/attendance` - Record attendance
- PUT `/emm/api/attendance/:id` - Update attendance

**And more...** See PHP_PROJECT_SETUP.md for full API documentation.

## Development

### Add New Feature

1. Create Model: `src/models/FeatureName.php`
2. Create Controller: `src/controllers/FeatureNameController.php`
3. Register Routes: Add routes in `src/Router.php`
4. Update Frontend: Add UI and API calls

See QUICK_REFERENCE.md for code examples.

## Support & Documentation

- [DATABASE_SETUP.md](DATABASE_SETUP.md) - Database configuration
- [PHP_PROJECT_SETUP.md](PHP_PROJECT_SETUP.md) - Backend setup and development
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Developer quick reference
- [setup-verification.html](setup-verification.html) - Verify database setup

## License

MIT License - See LICENSE file for details

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

---

**Version:** 2.0 (PHP Backend Edition)  
**Last Updated:** 2026-07-23
