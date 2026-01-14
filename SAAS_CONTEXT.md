# SAAS PORTAL TECH STACK & CONVENTION

## 1. Project Structure
- Root: `saas-portal/`
- Backend: `backend/` (NestJS, TypeScript, Node.js v22+)
- Frontend: `frontend/` (React + Vite, TypeScript)

## 2. Backend Stack (NestJS)
- Framework: NestJS
- Database ORM: TypeORM (or Prisma) connecting to PostgreSQL (Citus).
- Docker Client: `dockerode` library.
- Validation: `class-validator`, `class-transformer`.
- Queue (Optional): BullMQ (for background provisioning).

## 3. Coding Style
- Backend: Use Standard NestJS architecture (Modules, Controllers, Services).
- Frontend: Functional Components, Hooks.
- Variables: `camelCase`.
- DTOs: Use DTOs for all API inputs/outputs.

## 4. Infrastructure
- Docker Network: `saas-infra_saas-network`.
- Docker Socket: `/var/run/docker.sock` (Mapped via OrbStack).
- Citus DB: `localhost:5433` (External port).

# SAAS PORTAL BUSINESS LOGIC

## Entities
1. **Lead**: Potential customer from Landing Page (name, email, phone, school_name, status: NEW/CONTACTED/CONVERTED).
2. **Tenant**: Official customer (derived from Lead). Has `subdomain`, `db_schema`, `config_json`, `deployment_status`.

## Modules
- **Public Module**: Landing page, Lead submission (No Auth).
- **Admin Module**: Dashboard, Lead Management, Tenant Configuration, Deployment Trigger (Requires Auth).
- **Provisioning Module**: Docker control + Mattermost Seeder.