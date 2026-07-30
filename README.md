# AetherPass — Enterprise Event Ticket Booking Platform

Monorepo: Next.js frontend · Spring Boot backend · MySQL / Redis / RabbitMQ.

```text
AetherPass/
├── frontend/          # Next.js (App Router) → Vercel
├── backend/           # Spring Boot 3 → Render
├── database/          # MySQL schema + seed
├── docker-compose.yml # Local MySQL + Redis + RabbitMQ
└── render.yaml        # Render Blueprint for the API
```

## Quick start (local)

### 1. Infrastructure
```bash
docker compose up -d
```
- MySQL `localhost:3307` (db/user/pass: `aetherpass`)
- Redis `localhost:6379`
- RabbitMQ `localhost:5673` · UI `http://localhost:15673`

### 2. Backend
```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```
- API `http://localhost:8080` · Health `/api/v1/health` · Swagger `/swagger-ui.html`

### 3. Frontend
```bash
cd frontend
cp .env.example .env.local
npm run dev
```
- App `http://localhost:3000`

### Demo logins
Password for all: `Password@123`
- `user@example.com`
- `organizer@livearena.in`
- `admin@aetherpass.dev`

## Deploy

### Frontend → Vercel
1. Import `https://github.com/Rahull-06/AetherPass` in [Vercel](https://vercel.com/new)
2. **Root Directory:** `frontend`
3. Env:
   - `NEXT_PUBLIC_API_URL` = `https://YOUR-RENDER-SERVICE.onrender.com/api/v1`
4. Deploy

### Backend → Render
1. Create free/managed **MySQL**, **Redis** (e.g. Upstash), **RabbitMQ** (e.g. CloudAMQP)
2. In [Render](https://dashboard.render.com): New → Blueprint → select this repo (`render.yaml`)  
   or New → Web Service → Docker · Root Directory `backend`
3. Set env (see `backend/.env.example`):
   - `DB_*`, `REDIS_*`, `RABBITMQ_*`
   - `JWT_SECRET` (long random string)
   - `CORS_ORIGINS` = your Vercel URL (e.g. `https://aetherpass.vercel.app`)
   - `FRONTEND_URL` = same Vercel URL
   - `SPRING_PROFILES_ACTIVE=prod,dev` (dev profile seeds demo catalog)
   - `JPA_DDL_AUTO=update` (first boot creates tables)
   - `PAYMENTS_PROVIDER=MOCK`
4. After API is live, paste its URL into Vercel `NEXT_PUBLIC_API_URL` and redeploy frontend

## Tech stack
- Frontend: Next.js, TypeScript, Tailwind, TanStack Query, Axios, RHF, Zod
- Backend: Java 21, Spring Boot 3, Security/JWT, JPA, Redis, RabbitMQ, OpenAPI
- Database: MySQL 8
