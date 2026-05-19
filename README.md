# ☁️ CloudCut

A collaborative video editing SaaS prototype built for the CloudCut Full-Stack Engineering Challenge.

## 🏗️ Architecture
```
┌─────────────────────────────────────────┐
│           Browser (React 19)            │
│  ┌──────────┐  ┌──────────┐  ┌───────┐  │
│  │ Timeline │  │  Player  │  │Assets │  │
│  └────┬─────┘  └────┬─────┘  └───┬───┘  │
│       └─────────────┴────────────┘      │
│              Zustand Stores             │
│         ┌──────────┬──────────┐         │
│         │ axios    │ Pusher.js│         │
│         └────┬─────┴────┬─────┘         │
└──────────────┼──────────┼───────────────┘
               │          │
        ┌──────┴──────┐   │
        │  NestJS API │   │
        │  :3000      │   │
        └──────┬──────┘   │
               │          │
    ┌──────────┴───────┐  │
    │                  │  │
┌───┴────┐        ┌────┴──┴──┐
│Postgres│        │  Pusher  │
└───┬────┘        └──────────┘
    │
┌───┴────┐   ┌────────┐   ┌──────┐
│ Redis  │──►│ BullMQ │──►│ffmpeg│
└────────┘   └────────┘   └──┬───┘
                             │
                          ┌──┴───┐
                          │AWS S3│
                          └──────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Docker Desktop running

### 1. Clone and install
```bash
git clone https://github.com/np789/cloudcut.git
cd cloudcut
```

### 2. Clone and install
```bash
docker compose up -d
```

### 3. Backend setup
```bash
cd backend
cp .env.example .env
# Fill in AWS and Pusher credentials in .env
npm install
npx prisma migrate dev
npx prisma db seed
npm run start:dev
```

### 4. Frontend setup (new terminal)
```bash
cd frontend
cp .env.example .env
# Fill in your Pusher KEY in .env
npm install
npm run dev
```

### 5. Open the app
Go to http://localhost:5173

**Demo login:** alice@cloudcut.dev / password123

## 📁 Project Structure
```
cloudcut/
├── README.md
├── docker-compose.yml
├── backend/
│   ├── src/
│   │   ├── auth/            # JWT authentication
│   │   ├── workspaces/      # Workspace management
│   │   ├── projects/        # Project CRUD
│   │   ├── assets/          # Asset upload + S3 presigned URLs
│   │   ├── timeline/        # Tracks, clips, effects
│   │   ├── exports/         # Export job management
│   │   ├── jobs/            # BullMQ processors + ffmpeg.wasm
│   │   └── collaboration/   # Pusher real-time sync
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   └── seed.ts          # Demo data
│   └── DESIGN.md            # Architecture decisions
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── timeline/    # Timeline, clips, ruler, playhead
│       │   ├── player/      # Video player
│       │   ├── inspector/   # Clip inspector + effects
│       │   └── assets/      # Asset browser
│       ├── state/           # Zustand stores + command pattern
│       ├── hooks/           # usePusher, useKeyboardShortcuts
│       └── services/        # API client
└── docs/
    ├── architecture.md      # System architecture
    ├── api-spec.md          # API documentation
    └── database-design.md   # Schema decisions
```

## 🛠️ Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Zustand, shadcn/ui, Tailwind CSS |
| Backend | NestJS, TypeScript, Prisma ORM |
| Database | PostgreSQL 16 |
| Queue | BullMQ + Redis |
| Video | ffmpeg.wasm |
| Storage | AWS S3 |
| Real-time | Pusher Channels |
| Build | Vite |

## ✅ Features Implemented

- [x] JWT authentication (register, login, refresh)
- [x] Workspace and project management
- [x] S3 presigned upload flow
- [x] ffmpeg.wasm asset processing pipeline (metadata, proxy, thumbnails, waveform)
- [x] Export pipeline (trim + concatenate clips → S3)
- [x] BullMQ job queues with retry + exponential backoff
- [x] Pusher real-time collaboration (operation broadcast + presence)
- [x] React timeline editor (drag, trim, select, delete, zoom, snap)
- [x] Clip inspector (transform + effects)
- [x] Undo/redo command pattern
- [x] Keyboard shortcuts (Space, Ctrl+Z, Delete, Home)
- [x] Cursor-based pagination
- [x] Idempotent export jobs
- [x] Daily cleanup cron job

## 📸 Screenshots

### Login
![Editor](docs/screenshots/login.png)

### Panels
![Timeline](docs/screenshots/panel.png)
