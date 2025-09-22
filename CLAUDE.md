# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Organization Survey Tool - 従業員エンゲージメント向上を目的とした組織改善ツール

**Key Requirements:**
- 1000人規模組織対応
- 完全匿名回答を保証
- Microsoft365 SSO連携（将来実装）
- オンプレミス環境でのデプロイ

## Development Commands

### Docker Environment
```bash
# Start all services
docker compose up --build

# Run in background
docker compose up -d --build

# Stop services
docker compose down

# View logs
docker compose logs -f [service-name]
```

### Access Points
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- API Documentation: http://localhost:3001/documentation
- Database: localhost:5432 (PostgreSQL)

### Testing
```bash
# E2E tests (Playwright) - automatically runs on pre-commit
npm run test:e2e

# Manual E2E test execution
npx playwright test

# Run specific test
npx playwright test tests/e2e/smoke.spec.ts

# Debug mode with UI
npx playwright test --ui
```

## Architecture

### Three-Layer Architecture
1. **Frontend**: React + TypeScript + Vite
   - Location: `frontend/` (to be created)
   - Port: 5173
   - State management for anonymous sessions
   - Responsive design for desktop/mobile

2. **Backend**: Node.js + Fastify + TypeScript
   - Location: `backend/` (to be created)
   - Port: 3001
   - RESTful API with OpenAPI documentation
   - Stateless design for horizontal scaling

3. **Database**: PostgreSQL 15
   - Managed via Docker
   - Anonymous response storage
   - Separate tables for progress tracking and responses

### Data Privacy Architecture
- **Response Anonymization**: No personal identifiers in response tables
- **Session Management**: Browser LocalStorage for duplicate prevention
- **Data Separation**: Progress (`survey_progress`) and responses (`survey_responses`) in separate tables
- **Audit Trail**: System logs without personal data exposure

## Development Workflow

### Feature Development
1. Create feature branch from main: `git checkout -b feature/[name]`
2. Implement in appropriate layer (frontend/backend/database)
3. Pre-commit hooks automatically run Playwright tests
4. Push and create PR for review

### Pre-commit Testing
- Configured via Husky in `.husky/pre-commit`
- Runs Playwright smoke tests before allowing commit
- Tests must pass for commit to proceed
- Configuration in `playwright.config.ts`

## Database Schema

Key tables (see `docs/database_design.md` for details):
- `surveys`: Survey definitions
- `questions`: Question bank with categories
- `survey_questions`: Survey-question associations
- `survey_responses`: Anonymous responses
- `survey_progress`: Session tracking (anonymous)
- `analytics_cache`: Aggregated results cache

## API Structure

Base endpoints (see `docs/api_specification.md` for details):
- `/api/surveys`: Survey management
- `/api/questions`: Question management
- `/api/responses`: Response submission
- `/api/analytics`: Dashboard data
- `/api/admin`: Administration (HR only)

## Security Considerations

1. **Authentication**: Microsoft365 SSO (pending implementation)
2. **Authorization**: Role-based (Employee/HR/Admin)
3. **Data Protection**: Complete response anonymization
4. **Rate Limiting**: Configured via environment variables
5. **SSL**: Required for production (cert paths in .env)

## Environment Configuration

Copy `.env.example` to `.env` and configure:
- Database credentials
- API ports and secrets
- SSL certificates (production)
- Azure AD settings (when implementing SSO)
- Logging and rate limiting

## MCP Integration

Project uses SuperClaude Framework with:
- **Serena MCP**: Database operations and project management
- **Playwright MCP**: E2E testing and browser automation

Serena project activated at: `/mnt/c/Users/Elite-3-04/claude2/organization-survey-tool`

## Important Notes

1. **Anonymous Responses**: Never add user identifiers to response data
2. **Pre-commit Tests**: Ensure Docker is running before commits
3. **Directory Structure**: Create `backend/` and `frontend/` directories when implementing
4. **Database Migrations**: Place in `database/migrations/` when created
5. **Documentation**: Update docs in `docs/` directory for major changes