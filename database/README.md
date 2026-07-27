# Database layer — AetherPass

```text
database/
├── schema/       # Canonical MySQL DDL (source of truth)
├── seed/         # Dev / demo data
└── migrations/   # Incremental SQL changes over time
```

## Local boot
`docker compose up -d` mounts schema + seed into MySQL on first container create.

## Flow
1. Design tables in `schema/`
2. Add sample rows in `seed/`
3. Mirror entities in `backend/.../entity`
4. Ship incremental changes via `migrations/` (later Flyway)
