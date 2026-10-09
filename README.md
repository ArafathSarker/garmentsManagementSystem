# Garments Factory Event Monitor

A real-time production event reconciliation system for garment manufacturing lines. Built with **Next.js 16**, **Express 5**, **PostgreSQL**, and **MQTT v5.0**.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Schema (3NF)](#database-schema-3nf)
- [REST API Reference](#rest-api-reference)
- [MQTT Integration](#mqtt-integration)
- [Frontend Architecture](#frontend-architecture)
- [AI Usage](#ai-usage)

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                      Frontend (Next.js 16)               │
│  ┌──────────┐  ┌──────────┐  ┌─────────┐  ┌──────────┐  │
│  │ Overview  │  │  Queue   │  │ Sources │  │Exceptions│  │
│  │   View    │  │  View    │  │  View   │  │   View   │  │
│  └────┬─────┘  └────┬─────┘  └────┬────┘  └────┬─────┘  │
│       └──────────────┴─────────────┴────────────┘        │
│                        │ polling (5s)                     │
│                   lib/api.ts + lib/store.ts               │
└────────────────────────┬─────────────────────────────────┘
                         │ HTTP (port 8080)
┌────────────────────────┴─────────────────────────────────┐
│                   Backend (Express 5)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │ POST /events│  │ GET  /state │  │  POST /ack      │  │
│  │  routes.ts  │  │  routes.ts  │  │  routes.ts      │  │
│  │  service.ts │  │  queries.ts │  │  service.ts     │  │
│  └──────┬──────┘  └──────┬──────┘  └───────┬─────────┘  │
│         └────────────────┴─────────────────┘             │
│                          │                               │
│  ┌───────────────────────┴───────────────────────────┐   │
│  │              MQTT Worker (modules/mqtt)            │   │
│  │  subscribe: fse-01/{id}/challenge                 │   │
│  │  publish:   fse-01/{id}/response                  │   │
│  │  publish:   fse-01/{id}/status                    │   │
│  └───────────────────────┬───────────────────────────┘   │
└──────────────────────────┼───────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              │   PostgreSQL (3NF)      │
              │  ┌──────────────────┐   │
              │  │production_sources│   │
              │  │production_events │   │
              │  │submission_attempts│  │
              │  │mqtt_challenges   │   │
              │  └──────────────────┘   │
              └─────────────────────────┘
```

---

## Project Structure

```
garmentsManagementSystem/
├── AI_USAGE.md                        # AI conversation log (assessment requirement)
├── README.md                          # This file
│
├── backend/
│   ├── .env                           # Local environment variables
│   ├── .env.example                   # Template for environment setup
│   ├── package.json
│   └── src/
│       ├── app/
│       │   └── index.ts               # Express app with middleware & route registration
│       ├── config/
│       │   └── db.ts                  # PostgreSQL connection pool (singleton)
│       ├── modules/
│       │   ├── events/
│       │   │   ├── routes.ts          # POST /api/events handler
│       │   │   └── service.ts         # Event processing with transaction isolation
│       │   ├── state/
│       │   │   ├── routes.ts          # GET /api/state handler
│       │   │   └── queries.ts         # SQL aggregation for real-time state
│       │   ├── ack/
│       │   │   ├── routes.ts          # POST /api/ack handler
│       │   │   └── service.ts         # Acknowledgement DB updates
│       │   └── mqtt/
│       │       └── worker.ts          # MQTT subscriber/publisher integration
│       ├── scripts/
│       │   └── createSchema.ts        # Database initialization runner
│       ├── server/
│       │   └── server.ts              # Entry point: boots Express + MQTT worker
│       └── shared/
│           └── db/
│               └── schema.ts          # 3NF schema definitions (name + sql objects)
│
└── frontend/
    ├── .env / .env.example
    ├── package.json
    └── src/
        ├── app/
        │   ├── layout.tsx             # Root layout with metadata
        │   ├── page.tsx               # Entry page with lazy loading
        │   └── control-deck.tsx       # Main control deck component
        ├── components/
        │   ├── DataTable.tsx          # Generic paginated table with useMemo
        │   ├── shell/                 # Layout chrome (Topbar, Sidebar, ControlDeck)
        │   ├── ui/                    # Reusable primitives (Badge, Panel, StatCard, etc.)
        │   └── views/                 # Feature views (Overview, Queue, Sources, Exceptions)
        └── lib/
            ├── api.ts                 # Typed API client with defensive normalization
            ├── store.ts               # Global state with useSyncExternalStore + polling
            └── utils.ts               # Shared utility functions
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 20
- **PostgreSQL** ≥ 15
- **npm** ≥ 10

### 1. Clone and install dependencies

```bash
git clone <repository-url>
cd garmentsManagementSystem

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Configure environment variables

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your PostgreSQL credentials and MQTT settings

# Frontend (optional — defaults to localhost:8080)
cp frontend/.env.example frontend/.env
```

### 3. Initialize the database

```bash
cd backend
npm run db:init
```

This executes the 3NF schema definitions from `shared/db/schema.ts`, creating all tables and indexes.

### 4. Start the servers

```bash
# Terminal 1 — Backend (Express + MQTT)
cd backend
npm run dev

# Terminal 2 — Frontend (Next.js)
cd frontend
npm run dev
```

- **Backend:** http://localhost:8080
- **Frontend:** http://localhost:3000

---

## Environment Variables

### Backend (`backend/.env`)

| Variable          | Description                        | Default                            |
|-------------------|------------------------------------|------------------------------------|
| `DATABASE_URL`    | PostgreSQL connection string       | —                                  |
| `PORT`            | Express server port                | `8080`                             |
| `HOST_NAME`       | Server hostname                    | `localhost`                        |
| `MQTT_BROKER_URL` | MQTT broker connection URI         | `mqtt://152.42.238.142:1883`       |
| `CANDIDATE_ID`    | Unique candidate identifier        | —                                  |

### Frontend (`frontend/.env`)

| Variable               | Description                 | Default                    |
|------------------------|-----------------------------|----------------------------|
| `NEXT_PUBLIC_API_URL`  | Backend API base URL        | `http://localhost:8080`    |

---

## Database Schema (3NF)

### `production_sources`
Stores registered production line identifiers.

| Column         | Type         | Constraints        |
|----------------|--------------|--------------------|
| `source_id`    | VARCHAR      | PRIMARY KEY        |
| `display_name` | VARCHAR      |                    |
| `created_at`   | TIMESTAMPTZ  | DEFAULT NOW()      |

### `production_events`
Records individual COUNT and VOID events with idempotency guarantees.

| Column            | Type         | Constraints                                          |
|-------------------|--------------|------------------------------------------------------|
| `source_id`       | VARCHAR      | NOT NULL, FK → production_sources                    |
| `event_id`        | VARCHAR      | NOT NULL                                             |
| `type`            | VARCHAR      | CHECK (COUNT \| VOID)                                |
| `quantity`        | INTEGER      | CHECK (>0 for COUNT, NULL for VOID)                  |
| `target_event_id` | VARCHAR      | References the COUNT being voided                    |
| `event_time`      | TIMESTAMPTZ  | NOT NULL                                             |
| `status`          | VARCHAR      | CHECK (ACCEPTED \| PENDING_REFERENCE)                |
| `acknowledged_at` | TIMESTAMPTZ  |                                                      |
| `created_at`      | TIMESTAMPTZ  | DEFAULT NOW()                                        |
| **PK**            |              | `(source_id, event_id)`                              |

**Unique partial index:** `one_void_per_count_idx` — ensures only one ACCEPTED VOID per COUNT.

### `submission_attempts`
Immutable audit log of every inbound event, regardless of outcome.

| Column           | Type         | Constraints                                                    |
|------------------|--------------|----------------------------------------------------------------|
| `id`             | UUID         | PRIMARY KEY, DEFAULT gen_random_uuid()                         |
| `raw_payload`    | JSONB        | NOT NULL — original event as received                          |
| `source_id`      | VARCHAR      |                                                                |
| `event_id`       | VARCHAR      |                                                                |
| `classification` | VARCHAR      | CHECK (ACCEPTED \| PENDING_REFERENCE \| DUPLICATE \| CONFLICT \| REJECTED) |
| `error_reason`   | TEXT         |                                                                |
| `received_at`    | TIMESTAMPTZ  | DEFAULT NOW()                                                  |

### `mqtt_challenges`
Tracks MQTT simulator challenge/response lifecycle.

| Column              | Type         | Constraints        |
|---------------------|--------------|--------------------|
| `challenge_id`      | VARCHAR      | PRIMARY KEY        |
| `request_body`      | JSONB        | NOT NULL           |
| `serialized_result` | JSONB        |                    |
| `status`            | VARCHAR      | NOT NULL           |
| `received_at`       | TIMESTAMPTZ  | DEFAULT NOW()      |
| `responded_at`      | TIMESTAMPTZ  |                    |

---

## REST API Reference

### `GET /health`

Health check endpoint.

```json
{ "status": "OK" }
```

### `POST /api/events`

Process a batch of production events. Events are processed individually within isolated transactions — a rejected item does not affect valid items in the same batch.
For `COUNT` events, the quantity must be an integer between 1 and 500 inclusive; exceeding 500 results in a `REJECTED` status.

**Request Body:** `Array<Event>`

```json
[
  {
    "source_id": "LINE-A",
    "event_id": "EV-001",
    "type": "COUNT",
    "quantity": 10,
    "event_time": "2026-10-09T08:00:00Z"
  },
  {
    "source_id": "LINE-A",
    "event_id": "EV-002",
    "type": "VOID",
    "target_event_id": "EV-001",
    "event_time": "2026-10-09T08:01:00Z"
  }
]
```

**Response:** `200 OK`

```json
{
  "results": [
    { "event_id": "EV-001", "status": "ACCEPTED", "error": null },
    { "event_id": "EV-002", "status": "ACCEPTED", "error": null }
  ]
}
```

Possible `status` values: `ACCEPTED`, `PENDING_REFERENCE`, `DUPLICATE`, `CONFLICT`, `REJECTED`

### `GET /api/state`

Returns aggregated system state computed from durable evidence. Supports an optional `source_id` query parameter (e.g., `?source_id=LINE-01`) to filter the results for a specific production source.

**Response:** `200 OK`

```json
{
  "summary": {
    "net_total": 13,
    "processed_events": 4,
    "pending_void": 0,
    "unresolved": 0,
    "duplicates": 0,
    "conflicts": 1,
    "rejected_submissions": 0
  },
  "pending": [
    {
      "source_id": "LINE-A",
      "event_id": "EV-002",
      "type": "COUNT",
      "quantity": 5,
      "status": "ACCEPTED",
      "event_time": "2026-10-09T08:01:00Z"
    }
  ],
  "exceptions": [
    {
      "source_id": "LINE-A",
      "event_id": "EV-001",
      "classification": "CONFLICT",
      "error": "Event ID exists with different payload",
      "received_at": "2026-10-09T08:07:15Z"
    }
  ]
}
```

### `POST /api/ack`

Acknowledge processed events.

**Request Body:**

```json
{ "event_ids": ["EV-002", "EV-003"] }
```

**Response:** `200 OK`

```json
{
  "message": "Events acknowledged",
  "results": [
    { "event_id": "EV-002", "result": "ACKED" },
    { "event_id": "EV-003", "result": "ACKED" }
  ]
}
```

---

## MQTT Integration

The backend subscribes to the simulator's MQTT broker using protocol version **5.0**.

| Topic                          | Direction | Purpose                        |
|--------------------------------|-----------|--------------------------------|
| `fse-01/{candidate_id}/challenge` | Subscribe | Receives event processing challenges |
| `fse-01/{candidate_id}/response`  | Publish   | Returns processed results      |
| `fse-01/{candidate_id}/status`    | Publish   | Sends online heartbeats        |

**Client ID format:** `fse01-{CANDIDATE_ID}-{8-char-random-hex}`

The MQTT worker uses the **same service layer** as the REST API (`processEventsService`), ensuring identical business logic regardless of the ingestion path.

---

## Frontend Architecture

### Key Patterns

| Pattern                  | Implementation                                                |
|--------------------------|---------------------------------------------------------------|
| **Lazy Loading**         | `next/dynamic` for deferred component loading                 |
| **Memoization**          | `useMemo` for sorting, filtering, and derived computations    |
| **Pagination**           | Client-side pagination in `DataTable` with configurable size  |
| **Global State**         | `useSyncExternalStore` with generation-counter polling        |
| **Defensive Boundaries** | API responses are normalized at the boundary (`normalizeState`) |
| **Optimistic UI**        | Acknowledgements remove rows instantly, revert on failure     |

### Views

- **Overview** — Summary stat cards, trend sparkline, and system health indicators
- **Queue** — Pending events awaiting acknowledgement with bulk-select actions
- **Sources** — Per-production-line rollup of pending counts and VOIDs
- **Exceptions** — Unresolved conflicts, duplicates, and rejected events

---

## AI Usage

All AI-assisted interactions are documented in [`AI_USAGE.md`](./AI_USAGE.md) as required by the assessment guidelines.
