# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HSOP (Hospital Senador Ozires Pontes) is a comprehensive hospital management system built with Flask. The system manages patient care workflows including emergency services, clinical admissions, nursing care, prescriptions, and patient tracking.

## Common Commands

### Running the Application
```bash
python run.py  # Development server with debug mode
```

### Database Management
- The system uses PostgreSQL in production and development
- Database models are defined in `app/models.py`
- Tables are auto-created on startup via `db.create_all()`

### Testing
```bash
python test_routes.py  # Route testing script
```

## Architecture Overview

### Application Structure
- **Flask Application Factory Pattern**: Main app created via `create_app()` in `app/__init__.py`
- **Blueprint Architecture**: Routes organized in `app/routes.py` with main and specialized blueprints
- **SQLAlchemy ORM**: Database models in `app/models.py` with complex relationships

### Core Components

#### Authentication System
- Custom login system (not Flask-Login) with session management
- `login_required` decorator in `app/routes.py:31-39`
- User context via `get_current_user()` function in `app/routes.py:42-45`

#### Database Models (Key Entities)
- **Funcionario**: Hospital staff/users with role-based access
- **Paciente**: Patient records with support for unidentified patients
- **Atendimento**: Emergency/outpatient visits
- **Internacao**: Clinical admissions with complex medical data
- **PrescricaoClinica**: Medical prescriptions with medication scheduling
- **Aprazamento**: Medication timing and administration tracking
- **EvolucaoEnfermagem**: Nursing progress notes

#### Configuration Management
- Environment-based config in `app/config.py`
- `ConfigDev` for local development (PostgreSQL)
- `ConfigProd` for deployment (uses DATABASE_URL env var)
- Switch between configs via `Config = ConfigDev/ConfigProd` assignment

### Key Features
- **Multi-role User System**: Doctors, nurses, reception staff, administrators
- **Patient Management**: Including newborn (RN) patient linking
- **Clinical Workflows**: Emergency → Observation → Admission → Discharge
- **Prescription Management**: With automated medication scheduling (aprazamento)
- **Document Generation**: PDF reports, prescriptions, medical certificates
- **Bed Management**: Hospital bed occupancy tracking

### File Organization
```
app/
├── __init__.py          # Flask app factory
├── config.py           # Environment configurations  
├── models.py           # SQLAlchemy database models
├── routes.py           # All route handlers and business logic
├── helpers.py          # Utility functions
├── timezone_helper.py  # Brazilian timezone handling
├── static/             # CSS, JavaScript, images
├── templates/          # Jinja2 HTML templates
└── temp/               # Temporary file storage

logs/                   # Application logs
backups/               # Database backups
```

### Development Notes

#### Timezone Handling
- System uses Brazilian timezone (America/Sao_Paulo)
- `now_brasilia()` helper function for consistent datetime creation
- Timezone conversion utilities in `app/timezone_helper.py`

#### JavaScript Architecture
- Extensive client-side functionality in `app/static/js/`
- Modal management, form validation, real-time updates
- Medication scheduling calendar (`calendario_aprazamento.js`)

#### Template System
- Base templates: `base.html`, `base_clinica.html`, `base_funcionarios.html`
- Role-specific interfaces for different user types
- Print-optimized templates for medical documents

### Important Constraints
- Patient IDs can be strings (Atendimento.id) or integers (Paciente.id)
- Some fields use JSON storage for complex data (medications, images)
- Database relationships are extensively used - be careful with foreign key constraints
- Timezone awareness is critical for all datetime operations

### Deployment
- Configured for Heroku/Railway deployment via `Procfile`
- Uses Gunicorn WSGI server: `gunicorn 'app:create_app()'`
- Python 3.10.13 runtime specified in `runtime.txt`