# AI History

Interactive story engine with AI-powered characters, objects, and locations.

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **AI**: LangChain + OpenRouter
- **Validation**: Zod
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest
- **Containerization**: Docker
- **Monorepo**: Turbo + npm workspaces

## Getting Started

### Prerequisites

- Node.js 20+
- Docker and Docker Compose

### Installation

1. Clone the repository
2. Copy the environment file:
   ```bash
   cp .env.example .env
   ```
3. Start the development environment:
   ```bash
   npm run docker:dev
   ```
4. Run database migrations:
   ```bash
   npm run db:migrate -w @ai-history/api -- --name init
   ```

### Development Commands

```bash
# Start development with Docker (Postgres + API)
npm run docker:dev

# Run without Docker (requires local PostgreSQL)
npm run dev

# Build the project
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage -w @ai-history/api

# Lint code
npm run lint

# Format code
npm run format

# Full verification (format + lint + typecheck + build + test)
npm run verify
```

## API Endpoints

### Health

- **GET /** — API root with endpoint list
- **GET /health** — Health check

### Users

- **POST /users/register** — Register a new user

### Sessions

- **POST /session/start** — Start a new history session
- **POST /session/:sessionId/interact** — Interact with a character, object, or location

### Documentation

- **GET /api/docs** — Swagger UI documentation
- **GET /api/swagger.json** — OpenAPI specification

## Project Structure

```
apps/
├── api/                  # Express API server
│   ├── src/
│   │   ├── config/       # Configuration files
│   │   ├── container/    # Dependency injection container
│   │   ├── controllers/  # Request handlers
│   │   ├── engine/       # AI agents (intent, character, object)
│   │   ├── interfaces/   # Repository interfaces
│   │   ├── middleware/   # Express middleware (error, logger)
│   │   ├── models/       # Domain models
│   │   ├── repositories/ # Data access layer
│   │   ├── routes/       # Express routes
│   │   ├── services/     # Business logic
│   │   ├── types/        # DTOs and validation schemas
│   │   └── utils/        # Utility functions
│   └── prisma/           # Prisma schema and migrations
└── web/                  # Frontend (placeholder)

packages/
└── i18n/                 # Shared i18n package (i18next)
```

## Database Models

### User

- id (UUID)
- name (string)
- email (string, unique)
- password (string)
- createdAt
- updatedAt
- deletedAt (soft delete)

## License

ISC
