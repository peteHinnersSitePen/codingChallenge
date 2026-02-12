# Issue Tracker MVP

A full-stack Issue Tracker application built with Angular 20 and Java (JDK 17), featuring user authentication, project management, issue tracking with real-time updates, and comprehensive filtering capabilities.

## Tech Stack

### Frontend
- **Angular 20** - Modern web framework with standalone components
- **TypeScript** - Type-safe development
- **RxJS** - Reactive programming for async operations
- **CSS** - Custom styling (no framework dependencies)

### Backend
- **Java 17** - Modern Java features
- **Spring Boot 3.2.0** - Application framework
- **Spring Data JPA** - Database abstraction layer
- **Spring Security** - Authentication and authorization
- **Spring WebSocket** - Real-time communication
- **JWT** - Token-based authentication
- **H2 Database** - In-memory database for development
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

✅ **Issues**
- Full CRUD operations for issues
- Server-side pagination
- Advanced filtering (status, priority, assignee, project, text search)
- Sorting capabilities
- Issue assignment to users
- Status workflow (Open → In Progress → Closed)
- Priority levels (Low, Medium, High, Critical)

✅ **Real-time Updates**
- WebSocket infrastructure for real-time notifications
- Backend publishes events on issue changes
- Frontend service structure ready for WebSocket integration

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
│   │       └── services/       # API services (auth, project, issue, websocket)
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
    │   │   │   ├── model/       # Domain models (User, Project, Issue)
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
- Projects: `GET|POST /api/projects`, `GET|PUT|DELETE /api/projects/{id}`
- Issues: `GET|POST /api/issues`, `GET|PUT|DELETE /api/issues/{id}`

**H2 Console** (for development): `http://localhost:8080/h2-console`
- JDBC URL: `jdbc:h2:mem:issuetracker`
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
- **User** (1) → (N) **Issue** (assignee relationship, optional)

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

**Note:** H2 in-memory database is used for development. For production, PostgreSQL with proper indexing should be configured.

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
- **WebSocket Infrastructure**: Backend ready with Spring WebSocket
- **STOMP Protocol**: Configured but requires additional frontend dependencies for full implementation
- **Current State**: Backend publishes events; frontend has service structure ready
- **MVP Approach**: Can be enhanced with sockjs-client and @stomp/stompjs packages

### Testing Strategy
- **Unit Tests**: Focus on business logic (services) with mocked dependencies
- **Integration Tests**: API + Database testing with test profile
- **Coverage**: Core functionality tested; can be expanded for comprehensive coverage

### Database Choice
- **H2 for Development**: Fast setup, no external dependencies
- **PostgreSQL Ready**: Configuration supports easy switch to PostgreSQL
- **Migration Strategy**: JPA DDL auto-update for MVP; Flyway/Liquibase recommended for production

## If I Had 2 More Days

### High Priority Enhancements

1. **Complete WebSocket Implementation**
   - Add sockjs-client and @stomp/stompjs to frontend
   - Implement full STOMP client connection
   - Real-time UI updates without page refresh
   - Connection management and reconnection logic

2. **Comments & Activity Log**
   - Comment entity and repository
   - Comment CRUD APIs
   - Activity log tracking (who changed what, when)
   - Comment thread UI in issue detail view
   - Activity timeline display

3. **Enhanced Error Handling**
   - Global error interceptor in Angular
   - User-friendly error messages
   - Error logging and monitoring
   - Validation feedback improvements

4. **User Management**
   - User profile page
   - User list endpoint (for assignee selection)
   - User search functionality
   - Avatar/profile picture support

5. **Advanced Filtering UI**
   - Save filter presets
   - URL-based filter state
   - Filter chips display
   - Clear all filters button

### Medium Priority Enhancements

6. **Issue Tags/Labels**
   - Tag entity and many-to-many relationship
   - Tag filtering in issue list
   - Tag management UI

7. **File Attachments**
   - File upload functionality
   - Attachment storage (local/S3)
   - Attachment display in issue detail

8. **Email Notifications**
   - Email service integration
   - Notifications on issue assignment
   - Notifications on status changes

9. **Search Improvements**
   - Full-text search in description
   - Search highlighting
   - Advanced search modal

10. **Performance Optimizations**
    - Lazy loading for large lists
    - Virtual scrolling for issue list
    - API response caching
    - Database query optimization

### Nice-to-Have Features

11. **Dashboard**
    - Project statistics
    - Issue status distribution charts
    - Recent activity feed
    - Quick actions

12. **Export Functionality**
    - Export issues to CSV/Excel
    - PDF report generation
    - Filtered export

13. **Dark Mode**
    - Theme switching
    - User preference storage

14. **Accessibility**
    - ARIA labels
    - Keyboard navigation
    - Screen reader support

15. **Internationalization**
    - Multi-language support
    - Date/time localization

## Known Limitations

1. **WebSocket**: Backend infrastructure is ready, but full STOMP client implementation requires additional npm packages
2. **Comments**: Placeholder structure exists; full implementation needed
3. **Activity Log**: Placeholder structure exists; full implementation needed
4. **User List**: No endpoint to list all users (needed for assignee selection dropdown)
5. **File Uploads**: Not implemented
6. **Email Notifications**: Not implemented

## Production Considerations

1. **Database**: Switch from H2 to PostgreSQL with proper connection pooling
2. **Security**: 
   - Use environment variables for JWT secret
   - Enable HTTPS
   - Implement rate limiting
   - Add CSRF protection for state-changing operations
3. **Monitoring**: Add logging framework (Logback), health checks, metrics
4. **Deployment**: 
   - Build frontend for production (`ng build --prod`)
   - Configure CORS for production domain
   - Set up CI/CD pipeline
5. **Scalability**: Consider Redis for session management, message queue for async processing

## License

This project is created as part of a coding assessment.
