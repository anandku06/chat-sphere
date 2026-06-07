# ChatSphere

ChatSphere is a TypeScript microservices backend for chat applications. It uses a `pnpm` monorepo, an API gateway, service-owned databases, and RabbitMQ events to keep data in sync across authentication, user, and conversation domains.

## What is in this repo

- `services/gateway-service` handles client-facing HTTP traffic
- `services/auth-service` manages registration, login, refresh, and token revocation
- `services/user-service` stores user profiles and search data
- `services/chat-service` manages conversations and messages
- `packages/common` contains shared validation, auth helpers, env parsing, events, and error utilities

## Architecture

```text
Client
  |
  v
Gateway Service
  |- /auth ----------> Auth Service ------> MySQL
  |- /users ---------> User Service ------> PostgreSQL
  `- /conversations -> Chat Service ------> MongoDB
                                             |
                                             `-> Redis

RabbitMQ
  Auth Service ---- publishes auth.user.registered
  User Service ---- consumes auth.user.registered
  User Service ---- publishes user.created
  Chat Service ---- consumes user.created
```

## Current stack

- Node.js
- TypeScript
- Express 5
- `pnpm` workspaces
- Zod
- Sequelize
- MySQL
- PostgreSQL
- MongoDB
- Redis
- RabbitMQ
- JWT
- Docker Compose

## Repository layout

```text
.
+-- packages/
|   `-- common/
+-- services/
|   +-- gateway-service/
|   +-- auth-service/
|   +-- user-service/
|   `-- chat-service/
+-- docker-compose.yml
+-- request.http
+-- pnpm-workspace.yaml
`-- readme.md
```

## Services

### Gateway service

The gateway is the public entry point. It exposes:

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/revoke`
- `GET /users`
- `GET /users/:id`
- `GET /users/search`
- `POST /users`
- `POST /conversations`
- `GET /conversations`
- `GET /conversations/:conversationId`
- `POST /conversations/:conversationId/messages`
- `GET /conversations/:conversationId/messages`
- `GET /health`

Protected routes require:

```http
Authorization: Bearer <access_token>
```

The gateway also forwards internal requests with:

```http
x-internal-token: <shared_internal_token>
```

Default port: `4000`

### Auth service

Responsibilities:

- register users
- hash passwords with `bcrypt`
- issue access and refresh tokens
- rotate refresh tokens
- revoke user refresh tokens
- publish `auth.user.registered` events
- expose `GET /health`

Default port: `4003`

Database: MySQL

### User service

Responsibilities:

- persist user profiles
- serve lookup and search operations
- consume `auth.user.registered`
- publish `user.created`
- expose `GET /health`

Default port: `4001`

Database: PostgreSQL

### Chat service

Responsibilities:

- create and list conversations
- create and list messages
- enforce participant access
- cache conversation data in Redis
- consume `user.created`
- expose `GET /health`

Default port in Compose: `4002`

Datastores:

- MongoDB
- Redis

## Event flow

1. A client registers through `POST /auth/register`.
2. The gateway forwards the request to the auth service.
3. The auth service stores credentials and publishes `auth.user.registered`.
4. The user service consumes that event and syncs the user into PostgreSQL.
5. The user service publishes `user.created`.
6. The chat service consumes `user.created` and upserts user data needed for chat operations.

## Local development

### Prerequisites

- Node.js 20+
- `pnpm`
- Docker / Docker Compose

### Install dependencies

```bash
pnpm install
```

### Environment setup

This repo currently uses a root `.env` for Docker Compose and service configuration. At minimum, make sure these values are present:

```env
NODE_ENV=production

GATEWAY_PORT=4000
AUTH_SERVICE_PORT=4003
USER_SERVICE_PORT=4001
CHAT_SERVICE_PORT=4002

JWT_SECRET=replace-with-a-strong-secret
JWT_REFRESH_SECRET=replace-with-a-second-strong-secret
INTERNAL_API_TOKEN=replace-with-a-shared-internal-token
JWT_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d

RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest
RABBITMQ_PORT=5672
RABBITMQ_MANAGEMENT_PORT=15672

REDIS_URL=redis://redis:6379
MONGO_URL=mongodb://root:password@mongo:27017/chatapp_chat_service?authSource=admin
USER_DB_URL=postgres://chatapp_user:chatapp_password@user-db:5432/chatapp_user_service
AUTH_DB_URL=mysql://chatapp_auth_user:chatapp_auth_password@auth-db:3306/chatapp_auth_service
```

If you use real secrets locally or in deployment, rotate them before sharing or committing the file.

### Run with Docker Compose

Build and start the full stack:

```bash
docker compose up --build
```

Run in the background:

```bash
docker compose up -d --build
```

The Compose setup includes:

- `gateway-service`
- `auth-service`
- `user-service`
- `chat-service`
- `auth-db` (MySQL)
- `user-db` (PostgreSQL)
- `mongo`
- `redis`
- `rabbitmq`

### Run services without Docker

If you want to run the Node services directly:

```bash
pnpm dev
```

Single-service examples:

```bash
pnpm --filter gateway-service dev
pnpm --filter @chat_app/auth-service dev
pnpm --filter @chat_app/user-service dev
pnpm --filter chat-service dev
```

### Build

```bash
pnpm build
```

### Start compiled services

```bash
pnpm --filter gateway-service start
pnpm --filter @chat_app/auth-service start
pnpm --filter @chat_app/user-service start
pnpm --filter chat-service start
```

## Workspace scripts

From the repo root:

- `pnpm dev`
- `pnpm build`
- `pnpm lint`
- `pnpm format`
- `pnpm test`

At the moment, service `test` scripts return `No tests yet`.

## Manual API testing

The repo includes [request.http](/e:/backend/chat_app_microservice/request.http) with starter requests for:

- user registration
- user login

Base gateway URL:

```text
http://localhost:4000
```

## Docker and deployment notes

Each service already has a Dockerfile, and `docker-compose.yml` is set up to run the full application stack with health checks and container networking.

If you are deploying with Dokploy or another Compose-based platform:

- deploy the repository as a Compose project
- provide the same environment variables used locally
- expose the gateway service port publicly
- replace all development secrets with production-grade values
- enable TLS at the platform or proxy layer

## Known gaps

- automated tests are not implemented yet
- the root `.env` currently carries real runtime configuration, so secret handling should be tightened before wider sharing
- some service source files still contain small inconsistencies in health-check labels and comments, even though the overall runtime flow is clear

## License

ISC
