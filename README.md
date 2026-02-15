# Potenciarte Event Platform

A high-performance, offline-first web application for managing large-scale corporate events. This platform handles event management, QR-based invitations, on-site attendance validation, and digital diploma issuance.

## 🚀 Tech Stack

### Architecture

- **Monorepo**: Turborepo / NPM Workspaces structure.
- **Client**: Next.js 14+ (App Router), Tailwind CSS, Lucide React.
- **API**: NestJS (Node.js framework), Passport.js.
- **Database**: PostgreSQL (Prisma ORM).
- **Authentication**: Firebase Auth (Client SDK & Admin SDK).
- **Infrastructure**: Docker (Local DB), Cloud Run (Production - Planned).

## 📂 Project Structure

```bash
.
├── api/                # NestJS Backend
│   ├── prisma/         # Database Schema & Migrations
│   ├── src/            # Application Logic
│   └── firebase-service-account.json (Ignored)
├── client/             # Next.js Frontend
│   ├── src/app/        # App Router Pages
│   └── src/context/    # React Contexts (Auth)
└── docker-compose.yml  # Local PostgreSQL Setup
```

## 🛠️ Prerequisites

- **Node.js** v18+
- **Docker** & Docker Compose
- **Firebase Project** with Authentication (Email/Password) enabled.

## ⚡ Getting Started

### 1. Environment Setup

**Backend (`api/.env`):**
Create a file named `.env` in the `api/` directory:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/potenciarte?schema=public"
```

_Note: Place your `firebase-service-account.json` key in the `api/` root directory._

**Frontend (`client/.env`):**
Create a file named `.env` in the `client/` directory with your Firebase config:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

### 2. Run Infrastructure (Database)

Start the local PostgreSQL container:

```bash
docker-compose up -d
```

Initialize the database schema:

```bash
cd api
npx prisma db push
```

### 3. Start Development Servers

**Backend (API):**

```bash
cd api
npm run start:dev
```

The API will start on `http://localhost:3000`.

**Frontend (Client):**

```bash
cd client
npm run dev
```

The Client will start on `http://localhost:3001` (or 3000 if generic).

## 🔐 Authentication & Roles

The platform uses **Firebase Authentication** but syncs user roles with the PostgreSQL database.

- **Admin Creation**: The **first user** to register via the frontend is automatically assigned the `ADMIN` role.
- **Staff Access**: Subsequent users are assigned the `STAFF` role by default.
- **Auth Flow**:
  1.  User logs in on Frontend (Firebase Client SDK).
  2.  Frontend sends ID Token to Backend.
  3.  Backend verifies Token (Firebase Admin SDK).
  4.  Backend checks/creates User in Postgres and returns Role.

## 📦 Deployment (Phase 1)

Currently configured for local development. Production deployment to Google Cloud Run and Vercel/Firebase Hosting is planned for Phase 2.

## ✨ Features (Phase 2 & 3)

### Event Management

- **Dashboard**: View upcoming and past events.
- **Create Event**: Set name, date, location, and description.
- **Details View**: real-time stats (attendees, check-ins).

### Attendee Management

- **CSV Import**: Bulk upload attendees (Email, Name, RUT).
- **List View**: Search and filter attendees.
- **Invitations**: Generate unique QR codes and email them via SendGrid.

### Check-in System

- **QR Scanner**: Built-in camera scanner for rapid check-in.
- **Manual Entry**: Fallback for lost tickets or unreadable codes.
- **Real-time Stats**: Live updates on attendance percentage.

## ⚙️ Configuration Updates

**Backend (`api/.env`):**
Add these new variables for email functionality:

```env
SENDGRID_API_KEY="SG.your_api_key..."
SENDGRID_FROM_EMAIL="events@yourdomain.com"
```

## 🧪 Verification

See `walkthrough.md` for a complete guide on how to verify all features, including:

1.  Creating an event.
2.  Uploading a test CSV.
3.  Sending a test invitation.
4.  Scanning the QR code to check-in.
