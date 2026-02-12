# Issue Tracker MVP

3 minute Loom Video Overview: https://www.loom.com/share/cb3667f889a7400a8d6405d62c248fc7

A full-stack Issue Tracker application built with Angular 20 and Java (JDK 17), featuring user authentication, project management, issue tracking with real-time updates, and comprehensive filtering capabilities.

## Tech Stack

### Frontend
- **Angular 20** - Modern web framework with standalone components
- **TypeScript** - Type-safe development
- **RxJS** - Reactive programming for async operations
- **SCSS** - Sass styling with component-scoped stylesheets (no framework dependencies)

### Backend
- **Java 17** - Modern Java features
- **Spring Boot 3.2.0** - Application framework
- **Spring Data JPA** - Database abstraction layer
- **Spring Security** - Authentication and authorization
- **Spring WebSocket** - Real-time communication
- **JWT** - Token-based authentication
- **H2 Database** - Embedded file-based database for development (persists across restarts)
- **PostgreSQL** - Production-ready database support
- **Maven** - Dependency management and build tool

## Features

✅ **Authentication**
- Email/password signup and login (no OAuth)
- JWT-based stateless authentication
- Protected routes with auth guards
- User session management

✅ **Projects**
- Create, read, update, delete projects
- Project ownership model
- Project listing and detail views
- Sorting (by name, created date, modified date)
- Search functionality
- Issues list displayed on project detail page

✅ **Issues**
- Full CRUD operations for issues
- Server-side pagination
- Advanced filtering (status, priority, assignee, project, text search)
- Sorting capabilities (by title, status, priority, created date, updated date)
- Issue assignment to users
- Status workflow (Open → In Progress → Closed)
- Priority levels (Low, Medium, High, Critical)
- Issue creator tracking

✅ **Comments**
- Full CRUD operations for comments on issues
- Comment thread UI in issue detail view
- Real-time comment updates via WebSocket (create, update, delete)
- Comment editing and deletion (author-only authorization)
- Click-to-reveal edit/delete actions for better UX
- Comment author and timestamp display
- Seamless integration with issue detail page

✅ **Real-time Updates**
- Full WebSocket implementation with STOMP protocol
- Real-time issue updates (create, update, delete) across all clients
- Real-time comment updates (create, update, delete)
- Connection management and automatic reconnection
- Issue detail page updates in real-time when issue is modified

✅ **Testing**
- Unit tests for core business logic (ProjectService, IssueService)
- Integration tests for API endpoints with database
- Test profile configuration

## Project Structure

```
sitepen/
├── frontend/                    # Angular 20 application
│   ├── src/
│   │   └── app/
│   │       ├── auth/            # Authentication components (login, signup)
│   │       ├── projects/       # Project components (list, detail)
│   │       ├── issues/          # Issue components (list with filters, detail)
│   │       ├── guards/          # Route guards (auth guard)
│   │       ├── interceptors/    # HTTP interceptors (auth token)
│   │       └── services/       # API services (auth, project, issue, comment, websocket)
│   ├── angular.json
│   ├── package.json
│   └── tsconfig.json
│
└── backend/                      # Spring Boot application
    ├── src/
    │   ├── main/
    │   │   ├── java/com/issuetracker/
    │   │   │   ├── config/      # Configuration (Security, CORS, WebSocket)
    │   │   │   ├── controller/  # REST controllers
    │   │   │   ├── dto/         # Data transfer objects
    │   │   │   ├── filter/      # JWT authentication filter
    │   │   │   ├── model/       # Domain models (User, Project, Issue, Comment)
    │   │   │   ├── repository/  # Data access layer
    │   │   │   ├── service/     # Business logic
    │   │   │   └── util/        # Utilities (JWT)
    │   │   └── resources/
    │   │       └── application.properties
    │   └── test/                # Test classes
    └── pom.xml
```

## Development Setup

### Prerequisites
- **Node.js** v18 or higher
- **Java JDK 17**
- **Maven** 3.6 or higher

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Build the project:
```bash
mvn clean install
```

3. Run the application:
```bash
mvn spring-boot:run
```

The backend will start on `http://localhost:8080`

**API Endpoints:**
- Authentication: `POST /api/auth/signup`, `POST /api/auth/login`
- Projects: `GET|POST /api/projects`, `GET|PUT|DELETE /api/projects/{id}` (supports `sortBy`, `sortDir`, `searchText` query params)
- Issues: `GET|POST /api/issues`, `GET|PUT|DELETE /api/issues/{id}` (supports pagination, filtering, sorting)
- Comments: `GET|POST /api/issues/{issueId}/comments`, `PUT|DELETE /api/issues/{issueId}/comments/{commentId}`
- WebSocket: `/ws` endpoint for real-time updates (`/topic/issues`, `/topic/issues/{issueId}/comments`)

**H2 Console** (for development): `http://localhost:8080/h2-console`
- JDBC URL: `jdbc:h2:file:./data/issuetracker` (file-based for persistence)
- Username: `sa`
- Password: (empty)

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend will start on `http://localhost:4200`

### Running Tests

**Backend Tests:**
```bash
cd backend
mvn test
```

If backend tests fail with errors like `Could not initialize plugin: MockMaker` or `Could not self-attach to current VM`, the cause is often a restricted execution environment (e.g. some CI runners or sandboxes). Run `mvn test` in a normal terminal, or try:

```bash
MAVEN_OPTS="--add-opens java.base/java.lang=ALL-UNNAMED" mvn test
```

**Frontend Tests:**
```bash
cd frontend
npm test
```

## Data Model & Indexing Strategy

### Relational Database Design

The application uses a **relational database** (H2 for dev, PostgreSQL for production) with the following justification:

**Why Relational:**
- Clear relationships between entities (User → Project → Issue)
- ACID compliance for data integrity
- Strong consistency requirements for issue tracking
- Complex queries with joins (filtering, pagination)
- Well-established patterns for this domain

**Entity Relationships:**
- **User** (1) → (N) **Project** (owner relationship)
- **Project** (1) → (N) **Issue** (project ownership)
- **User** (1) → (N) **Issue** (assignee relationship, optional; creator relationship for issue creator)
- **Issue** (1) → (N) **Comment** (comments on issue)
- **User** (1) → (N) **Comment** (comment author)

**Indexing Strategy:**
- Primary keys: Auto-indexed by JPA
- Foreign keys: Indexed for join performance
- **Issue table indexes** (recommended for production):
  - `project_id` - For filtering by project
  - `assignee_id` - For filtering by assignee
  - `status` - For status filtering
  - `priority` - For priority filtering
  - `title` (text search) - Full-text index for search functionality
  - Composite index on `(project_id, status)` for common query patterns

**Note:** H2 file-based database is used for development (data persists across restarts). For production, PostgreSQL with proper indexing should be configured.

## Trade-offs & Design Decisions

### Authentication
- **JWT over Session-based**: Chosen for stateless scalability and API-first design
- **No OAuth**: Simplified implementation per requirements, but extensible architecture
- **Password Storage**: BCrypt hashing with Spring Security's PasswordEncoder

### API Design
- **RESTful conventions**: Standard HTTP methods and status codes
- **Pagination**: Server-side pagination to handle large datasets efficiently
- **Filtering**: Query parameters for flexibility, with server-side processing
- **Error Handling**: Consistent error response format with meaningful messages

### Frontend Architecture
- **Standalone Components**: Angular 20's modern approach, no NgModules
- **Service Layer**: Centralized API communication with typed interfaces
- **Reactive Programming**: RxJS Observables for async operations
- **Route Guards**: Protection at route level for authenticated access

### Real-time Updates
- **WebSocket Infrastructure**: Fully implemented with Spring WebSocket
- **STOMP Protocol**: Complete implementation with sockjs-client and @stomp/stompjs
- **Current State**: Real-time updates working for issues and comments
- **Connection Management**: Automatic reconnection with pending subscription handling

### Testing Strategy
- **Unit Tests**: Focus on business logic (services) with mocked dependencies
- **Integration Tests**: API + Database testing with test profile
- **Coverage**: Core functionality tested; can be expanded for comprehensive coverage

### Database Choice
- **H2 for Development**: Fast setup, no external dependencies
- **PostgreSQL Ready**: Configuration supports easy switch to PostgreSQL
- **Migration Strategy**: JPA DDL auto-update for MVP; Flyway/Liquibase recommended for production

## If I Had 2 More Days

1. **User Management**
   - Admin options on account creation
   - Admin priviliges
   - User profile page
   - User list endpoint (for assignee selection)
   - User search functionality
   - Avatar/profile picture support

2. **Enhanced Error Handling**
   - Global error interceptor in Angular
   - User-friendly error messages
   - Error logging and monitoring
   - Validation feedback improvements


## License

This project is created as part of a coding assessment.
