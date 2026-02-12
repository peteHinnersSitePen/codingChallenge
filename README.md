# Issue Tracker MVP

A full-stack Issue Tracker application built with Angular 20 and Java (JDK 17).

## Project Structure

```
sitepen/
├── frontend/          # Angular 20 application
│   ├── src/
│   │   └── app/
│   │       ├── auth/          # Authentication components
│   │       ├── projects/      # Project components
│   │       └── issues/        # Issue components
│   └── package.json
│
└── backend/           # Spring Boot application
    ├── src/
    │   └── main/
    │       ├── java/com/issuetracker/
    │       │   ├── config/     # Configuration classes
    │       │   └── model/      # Domain models (User, Project, Issue)
    │       └── resources/
    │           └── application.properties
    └── pom.xml
```

## Tech Stack

### Frontend
- Angular 20
- TypeScript
- CSS

### Backend
- Java 17
- Spring Boot 3.2.0
- Spring Data JPA
- Spring Security
- Spring WebSocket (for real-time updates)
- H2 Database (development)
- PostgreSQL (production ready)

## Current Status

✅ Basic project structure created
✅ Angular frontend skeleton with routing
✅ Spring Boot backend skeleton with security configuration
✅ Domain models (User, Project, Issue) defined
⏳ Authentication implementation (in progress)
⏳ CRUD APIs (pending)
⏳ UI components (pending)
⏳ Real-time updates (pending)
⏳ Tests (pending)

## Next Steps

1. Implement authentication (email+password, JWT)
2. Implement Project CRUD APIs
3. Implement Issue CRUD APIs with pagination/filtering
4. Build UI components
5. Add WebSocket/SSE for real-time updates
6. Write tests
7. Complete README with run instructions

## Development Setup

### Prerequisites
- Node.js (v18+)
- Java JDK 17
- Maven 3.6+

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

### Backend Setup
```bash
cd backend
mvn clean install
mvn spring-boot:run
```

## Notes

- Authentication: Email+password only (no OAuth)
- Docker: Not used (as per requirements)
- Database: H2 for development, PostgreSQL for production
