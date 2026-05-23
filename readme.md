# ChatSphere

A TypeScript-based chat backend built as a `pnpm` monorepo with independently deployable services. The project separates authentication, user management, and conversation/message handling into focused services behind an API gateway, while using event-driven communication to keep service-owned data in sync.

## Overview

This repository contains:

- `gateway-service` as the public entry point for client applications
- `auth-service` for registration, login, refresh-token rotation, and token revocation
- `user-service` for user profile storage and search
- `chat-service` for conversations and messages
- `packages/common` for shared validation, middleware, event contracts, errors, and logging helpers

The current stack combines synchronous HTTP calls with asynchronous RabbitMQ events:

- Client requests enter through the gateway
- The gateway validates JWTs for protected routes
- Internal service-to-service calls are protected with `x-internal-token`
- Auth publishes user-registration events
- User service consumes auth events and persists searchable user records
- User service also publishes user-created events for downstream consumers
- Chat service stores conversation/message data and uses Redis as a cache layer

## Architecture

```text
Client
  |
  v
Gateway Service (Express)
  |- /auth ----------> Auth Service ------> MySQL
  |- /users ---------> User Service ------> PostgreSQL
  |- /conversations -> Chat Service ------> MongoDB
  |                                         |
  |                                         -> Redis cache
  |
  -> JWT verification for client requests

RabbitMQ
  Auth Service ---- publishes auth.user.registered
  User Service ---- consumes auth.user.registered
  User Service ---- publishes user.created
  Chat Service ---- starts RabbitMQ consumers on boot
```

## Repository Structure

```text
.
+-- packages/
|   `-- common/              # Shared runtime utilities, schemas, auth helpers, event contracts
+-- services/
|   +-- gateway-service/     # Public API gateway
|   +-- auth-service/        # Authentication and refresh token lifecycle
|   +-- user-service/        # User records and search
|   `-- chat-service/        # Conversations, messages, caching
+-- docker-compose.yml      # Local infrastructure services
+-- request.http            # Basic manual API requests
`-- pnpm-workspace.yaml     # Workspace configuration
```

## Tech Stack

- Node.js
- TypeScript
- Express 5
- `pnpm` workspaces
- Zod for runtime validation
- Sequelize
- MySQL for auth data
- PostgreSQL for user data
- MongoDB for chat data
- Redis for chat caching
- RabbitMQ for domain events
- JWT for authentication

## Services

### Gateway Service

The gateway is the only service intended for direct client access.

Responsibilities:

- Exposes public HTTP endpoints
- Validates request payloads before proxying
- Verifies JWT access tokens on protected routes
- Forwards authenticated identity to downstream services

Default port:

- `4000` via `GATEWAY_PORT`

Main route groups:

- `/auth`
- `/users`
- `/conversations`

### Auth Service

The auth service owns credentials and refresh tokens.

Responsibilities:

- Register users
- Hash and verify passwords with `bcrypt`
- Issue JWT access and refresh tokens
- Rotate refresh tokens
- Revoke a user's refresh tokens
- Publish `auth.user.registered` events to RabbitMQ

Default port:

- `4003` via `AUTH_SERVICE_PORT`

Persistence:

- MySQL

### User Service

The user service owns user profile records used for listing and search.

Responsibilities:

- Persist users in PostgreSQL
- Serve user lookup and search endpoints
- Consume auth registration events for profile synchronization
- Publish `user.created` events

Default port:

- `4001` via `USER_SERVICE_PORT`

Persistence:

- PostgreSQL

### Chat Service

The chat service owns conversations and messages.

Responsibilities:

- Create and list conversations
- Create and list messages
- Enforce that only conversation participants can read or post
- Cache conversation summaries/details in Redis
- Persist messages and conversation data in MongoDB
- Start RabbitMQ consumers during boot

Default port:

- `4002` via `CHAT_SERVICE_PORT` in the current codebase

Persistence:

- MongoDB
- Redis

## Shared Package

`packages/common` contains reusable building blocks shared across services:

- `validateRequest` request validation middleware
- `asyncHandler` helpers
- internal auth middleware
- auth-related shared types and headers
- environment parsing helpers
- HTTP error utilities
- event definitions for RabbitMQ integration
- shared logger setup

## Event-Driven Flow

The project uses RabbitMQ to reduce direct coupling between services.

Current event contracts:

- `auth.user.registered`
- `user.created`

Example registration flow:

1. Client calls `POST /auth/register` through the gateway.
2. Gateway forwards the request to the auth service.
3. Auth service creates credentials and a refresh token in MySQL.
4. Auth service publishes `auth.user.registered`.
5. User service consumes that event and upserts the user into PostgreSQL.
6. User service publishes `user.created` for downstream consumers.

This pattern helps each service keep ownership of its own database while still reacting to domain events emitted elsewhere.

## Authentication Model

Two authentication mechanisms are used in this project:

### Client Authentication

Protected gateway routes require:

```http
Authorization: Bearer <access_token>
```

The gateway validates the token using `JWT_SECRET`.

### Internal Service Authentication

Gateway-to-service and service-to-service HTTP requests use:

```http
x-internal-token: <shared_internal_token>
```

The token value must match `INTERNAL_API_TOKEN` in each protected service.

For chat requests, the authenticated user identity is forwarded with:

```http
x-user-id: <user_uuid>
```

## Local Infrastructure

The included [docker-compose.yml](/e:/backend/chat_app_microservice/docker-compose.yml) starts the backing services required by the microservices:

- MySQL for `auth-service`
- PostgreSQL for `user-service`
- MongoDB for `chat-service`
- Redis for `chat-service`
- RabbitMQ with management UI

Default container ports:

- PostgreSQL: `5432`
- MySQL: `3306`
- MongoDB: `27017`
- Redis: `6379`
- RabbitMQ: `5672`
- RabbitMQ management UI: `15672`

## Prerequisites

Before running the project locally, make sure you have:

- Node.js 20+ recommended
- `pnpm` installed
- Docker and Docker Compose

## Installation

```bash
pnpm install
```

## Environment Variables

Create environment files for each service before starting the application. The codebase expects service-local environment variables and validates them on boot.

### Gateway Service

Suggested file: `services/gateway-service/.env`

```env
NODE_ENV=development
GATEWAY_PORT=4000
AUTH_SERVICE_URL=http://localhost:4003
USER_SERVICE_URL=http://localhost:4001
CHAT_SERVICE_URL=http://localhost:4002
JWT_SECRET=replace-with-a-secret-at-least-32-characters
INTERNAL_API_TOKEN=replace-with-a-shared-internal-token
```

### Auth Service

Suggested file: `services/auth-service/.env`

```env
NODE_ENV=development
AUTH_SERVICE_PORT=4003
AUTH_DB_URL=mysql://chatapp_auth_user:chatapp_auth_password@localhost:3306/chatapp_auth_service
JWT_SECRET=replace-with-a-secret-at-least-32-characters
JWT_EXPIRES_IN=1d
JWT_REFRESH_SECRET=replace-with-a-second-secret-at-least-32-characters
JWT_REFRESH_EXPIRES_IN=7d
INTERNAL_API_TOKEN=replace-with-a-shared-internal-token
RABBITMQ_URL=amqp://guest:guest@localhost:5672
```

### User Service

Suggested file: `services/user-service/.env`

```env
NODE_ENV=development
USER_SERVICE_PORT=4001
USER_DB_URL=postgres://chatapp_user:chatapp_password@localhost:5432/chatapp_user_service
RABBITMQ_URL=amqp://guest:guest@localhost:5672
INTERNAL_API_TOKEN=replace-with-a-shared-internal-token
```

### Chat Service

Suggested file: `services/chat-service/.env`

```env
NODE_ENV=development
CHAT_SERVICE_PORT=4002
JWT_SECRET=replace-with-a-secret-at-least-32-characters
RABBITMQ_URL=amqp://guest:guest@localhost:5672
REDIS_URL=redis://localhost:6379
MONGO_URL=mongodb://root:password@localhost:27017/?authSource=admin
INTERNAL_API_TOKEN=replace-with-a-shared-internal-token
```

## Running the Project

### 1. Start infrastructure

```bash
docker compose up -d
```

### 2. Start the services

Run all workspace services in development mode:

```bash
pnpm dev
```

Or run a single service from its package directory:

```bash
pnpm --filter gateway-service dev
pnpm --filter @chat_app/auth-service dev
pnpm --filter @chat_app/user-service dev
pnpm --filter chat-service dev
```

### 3. Build for production

```bash
pnpm build
```

### 4. Start compiled output

Each service exposes a `start` script after build:

```bash
pnpm --filter gateway-service start
pnpm --filter @chat_app/auth-service start
pnpm --filter @chat_app/user-service start
pnpm --filter chat-service start
```

## Workspace Scripts

From the repository root:

- `pnpm dev` runs `dev` in every workspace package
- `pnpm build` builds every workspace package
- `pnpm lint` runs lint scripts across services
- `pnpm format` checks formatting
- `pnpm test` runs each package `test` script

Current test status:

- Each service currently reports `No tests yet`

## Public API Summary

The gateway exposes the primary client-facing routes below.

### Auth Endpoints

Base path: `/auth`

- `POST /register`
- `POST /login`
- `POST /refresh`
- `POST /revoke`

Example request bodies:

```json
{
  "email": "user@example.com",
  "displayName": "Example User",
  "password": "strong-password"
}
```

```json
{
  "email": "user@example.com",
  "password": "strong-password"
}
```

```json
{
  "refreshToken": "your-refresh-token"
}
```

```json
{
  "userId": "uuid"
}
```

### User Endpoints

Base path: `/users`

Protected:

- Yes

Routes:

- `GET /users`
- `GET /users/:id`
- `GET /users/search?query=<term>&limit=<1-10>&exclude=<uuid>`
- `POST /users`

Create user body:

```json
{
  "email": "user@example.com",
  "displayName": "Example User"
}
```

### Conversation Endpoints

Base path: `/conversations`

Protected:

- Yes

Routes:

- `POST /conversations`
- `GET /conversations`
- `GET /conversations/:conversationId`
- `POST /conversations/:conversationId/messages`
- `GET /conversations/:conversationId/messages`

Create conversation body:

```json
{
  "title": "Project Chat",
  "participantIds": ["uuid-1", "uuid-2"]
}
```

Create message body:

```json
{
  "body": "Hello from the chat service"
}
```

Message query parameters:

- `limit` from `1` to `200`
- `after` as an ISO datetime string

## Development Notes

- All services are written in TypeScript and use path aliases such as `@/`
- Runtime configuration is validated at startup with Zod-based schemas
- Errors are normalized through shared HTTP error handling utilities
- Service boundaries are explicit, with each service owning its own database
- Redis is used to cache chat conversation data and invalidated when new messages are posted

## Known Gaps

At the current state of the repository:

- automated tests have not been implemented yet
- there is no root `.env.example` or service-level `.env.example` committed yet
- local port defaults for gateway and chat service conflict unless overridden
- containerized application services are not yet defined in `docker-compose.yml`; only infrastructure dependencies are included

## Manual Testing

You can use [request.http](/e:/backend/chat_app_microservice/request.http) for quick auth smoke tests. It currently includes starter requests for:

- user registration
- user login

## Future Improvements

- add service-level and integration test coverage
- add health-check endpoints consistently across services
- add Dockerfiles and full service orchestration
- add API documentation via OpenAPI or Swagger
- add observability for traces, metrics, and centralized logs
- add Socket.IO or WebSocket delivery if real-time push is planned for clients

## License

This project currently declares the `ISC` license in package manifests.
