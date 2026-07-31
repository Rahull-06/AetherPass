# AetherPass

**Enterprise-style event ticket booking platform** — discover shows, hold seats, pay, and check in with QR. Built as a production-oriented monorepo with role-based apps for users, organizers, and admins.

| | |
|---|---|
| **Live app** | [aether-pass-alpha.vercel.app](https://aether-pass-alpha.vercel.app) |
| **API health** | [aetherpass-api.onrender.com/api/v1/health](https://aetherpass-api.onrender.com/api/v1/health) |
| **Swagger** | `/swagger-ui.html` on the API host |
| **Repo** | [github.com/Rahull-06/AetherPass](https://github.com/Rahull-06/AetherPass) |

> **Note:** The free Render API spins down after idle. The first request after sleep can take 30–60 seconds.

---

## Features

### Public
- Browse and search events by category and city
- Event detail with venue, pricing, seat map, and reviews
- Register / login · forgot & reset password

### Attendee
- Timed seat hold (Redis-backed locks)
- Coupon offers at checkout (flat / percent, min order)
- Checkout via **mock payment** or **Razorpay** (configurable)
- Confirmed tickets with QR payloads · booking history · cancel
- Wishlist and in-app notifications

### Organizer
- Create draft events (category, pricing, seats, banner URL)
- Submit events for admin approval
- Gate check-in: camera QR scan or paste payload → validate / mark used

### Admin
- Approve / reject pending events
- User search, suspend / restore
- Coupon CRUD and activation
- Dashboard analytics (users, events, tickets, revenue, popular shows)

---

## Architecture

```text
┌─────────────────┐     JWT      ┌──────────────────────┐
│  Next.js (Vercel)│ ───────────▶ │ Spring Boot (Render) │
│  App Router UI   │   /api/v1    │  Security · JPA · OpenAPI │
└─────────────────┘              └──────────┬───────────┘
                                            │
              ┌─────────────────────────────┼─────────────────────────────┐
              ▼                             ▼                             ▼
         MySQL 8                      Redis 7                      RabbitMQ
      (source of truth)        seat locks · event cache      booking.confirmed /
                                                              booking.cancelled
                                                              → PDF ticket + notify
```

| Layer | Responsibility |
|-------|----------------|
| **Frontend** | Next.js App Router, TanStack Query, Axios, RHF + Zod, Tailwind |
| **API** | Spring Boot 3 / Java 21, JWT access + refresh, RBAC |
| **MySQL** | Canonical schema under `database/schema` + seed |
| **Redis** | Seat holds (~5 min) · public event list/detail cache |
| **RabbitMQ** | Async booking events → ticket PDF + notifications |
| **Payments** | `MOCK` (default) or `RAZORPAY` + webhook |

```text
AetherPass/
├── frontend/           # Next.js → Vercel
├── backend/            # Spring Boot → Render (Docker)
├── database/           # MySQL schema + seed + migrations
├── docker-compose.yml  # Local MySQL · Redis · RabbitMQ
└── render.yaml         # Render Blueprint for the API
```

---

## Tech stack

| Area | Choices |
|------|---------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind 4, TanStack Query, Axios, RHF, Zod, html5-qrcode |
| Backend | Java 21, Spring Boot 3.4, Security/JWT (JJWT), Data JPA, Redis, AMQP, springdoc OpenAPI, PDFBox |
| Data / infra | MySQL 8, Redis 7, RabbitMQ 3, Docker Compose |
| Deploy | Vercel (frontend) · Render Docker (API) · managed MySQL / Upstash / CloudAMQP |

---

## Demo accounts

Password for all: **`Password@123`**

| Email | Role |
|-------|------|
| `user@example.com` | Attendee |
| `organizer@livearena.in` | Organizer |
| `admin@aetherpass.dev` | Admin |

---

## Quick start (local)

**Prerequisites:** Docker, JDK 21, Maven 3.9+, Node 20+

### 1. Infrastructure
```bash
docker compose up -d
```
| Service | Port |
|---------|------|
| MySQL | `3307` (db/user/pass: `aetherpass`) |
| Redis | `6379` |
| RabbitMQ AMQP | `5673` |
| RabbitMQ UI | [localhost:15673](http://localhost:15673) (`aetherpass` / `aetherpass`) |

### 2. Backend
```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```
- API: [http://localhost:8080](http://localhost:8080)
- Health: `/api/v1/health`
- Swagger: `/swagger-ui.html`

Env overrides: copy `backend/.env.example` patterns into your shell or IDE run config.

### 3. Frontend
```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```
- App: [http://localhost:3000](http://localhost:3000)

---

## API overview

Base path: `/api/v1`

| Prefix | Purpose |
|--------|---------|
| `/health` | Liveness |
| `/auth` | Register, login, refresh, logout, password reset, me |
| `/events` | Browse, detail, seats, reviews |
| `/venues` | Venue list |
| `/bookings` | Hold, coupons, cancel, history |
| `/payments` | Create order, verify, mock-complete, webhook |
| `/coupons` | Public offers |
| `/wishlist` | Attendee wishlist |
| `/notifications` | In-app notifications |
| `/organizer/events` | Organizer event lifecycle |
| `/organizer/scan` | Ticket QR validation |
| `/admin/events` | Approve / reject |
| `/admin/users` | List / suspend |
| `/admin/coupons` | Coupon management |
| `/admin/analytics` | Ops dashboard stats |

---

## Deploy

### Frontend → Vercel
1. Import this repo in [Vercel](https://vercel.com/new)
2. **Root Directory:** `frontend`
3. Environment:
   - `NEXT_PUBLIC_API_URL` = `https://<your-render-service>.onrender.com/api/v1`
4. Deploy

### Backend → Render
1. Provision **MySQL**, **Redis** (e.g. Upstash), **RabbitMQ** (e.g. CloudAMQP)
2. [Render](https://dashboard.render.com): New → Blueprint (`render.yaml`) **or** Web Service → Docker · root `backend`
3. Set env (see `backend/.env.example`):

| Variable | Notes |
|----------|--------|
| `DB_*` | Use the **public** MySQL host/port (not private-only hostnames) |
| `REDIS_*` / `REDIS_SSL` | Upstash typically needs SSL |
| `RABBITMQ_*` / `RABBITMQ_SSL` / `RABBITMQ_VHOST` | CloudAMQP amqps → port `5671`, SSL `true` |
| `JWT_SECRET` | Long random secret (≥ 256-bit) |
| `CORS_ORIGINS` | Your Vercel origin, e.g. `https://aether-pass-alpha.vercel.app` |
| `FRONTEND_URL` | Same as above |
| `SPRING_PROFILES_ACTIVE` | `prod,dev` seeds demo catalog + accounts |
| `JPA_DDL_AUTO` | `update` on first boot |
| `PAYMENTS_PROVIDER` | `MOCK` (or `RAZORPAY` + keys) |

4. After the API is live, set Vercel `NEXT_PUBLIC_API_URL` and redeploy the frontend once.

---

## Disclaimer

Portfolio / learning production system — not affiliated with any commercial ticketing brand.
