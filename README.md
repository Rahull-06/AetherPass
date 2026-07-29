# AetherPass — Enterprise Event Ticket Booking Platform

Monorepo layout with a clear Frontend → Backend → Database flow.

```text
 AetherPass/
├── frontend/          # Next.js (App Router) — UI
├── backend/           # Spring Boot 3 — REST API
├── database/          # MySQL schema + seed
└── docker-compose.yml # MySQL + Redis + RabbitMQ (local)
```

## Quick start

### 1. Infrastructure
```bash
docker compose up -d
```
- MySQL: `localhost:3307` (db/user/pass: `aetherpass`) — host `3307` avoids local MySQL on `3306`
- Redis: `localhost:6379`
- RabbitMQ: `localhost:5673` · UI `http://localhost:15673` (aetherpass / aetherpass)

### 2. Backend
```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```
- API: `http://localhost:8080`
- Health: `http://localhost:8080/api/v1/health`
- Swagger: `http://localhost:8080/swagger-ui.html`

### 3. Frontend
```bash
cd frontend
cp .env.example .env.local
npm run dev
```
- App: `http://localhost:3000`

## Folder flow

| Layer | Path | Responsibility |
|-------|------|----------------|
| UI | `frontend/src/app` | Routes by role: public / user / organizer / admin |
| UI modules | `frontend/src/features` | Feature-specific UI + logic |
| API client | `frontend/src/services` | Axios calls to backend |
| API | `backend/.../controller` | HTTP endpoints |
| Business | `backend/.../service` | Rules (booking, seats, payments) |
| Data access | `backend/.../repository` | JPA |
| Schema | `database/schema` | Source-of-truth SQL |
| Seed | `database/seed` | Dev/demo data |

## Tech stack
- Frontend: Next.js, TypeScript, Tailwind, TanStack Query, Axios, RHF, Zod
- Backend: Java 21, Spring Boot 3, Security, JPA, Redis, RabbitMQ, OpenAPI
- Database: MySQL 8
