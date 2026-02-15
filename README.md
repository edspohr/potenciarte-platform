# Potenciarte Event Platform 🚀

**A high-performance, offline-first Event Management Platform** built for handling large-scale corporate events. It seamlessly manages the entire event lifecycle: from guest list management and QR-ticket issuance via email to on-site staff check-ins with a robust Progressive Web App (PWA) that works without internet access.

---

## 🏗️ Architecture & Tech Stack

The platform allows for a **Monorepo** structure separating the Backend API and Frontend Client.

### **Backend (API)**

- **Framework**: [NestJS](https://nestjs.com/) (Node.js) - Modular and scalable architecture.
- **Database**: [PostgreSQL](https://www.postgresql.org/) - Relational data (Events, Attendees).
- **ORM**: [Prisma](https://www.prisma.io/) - Type-safe database access and migrations.
- **Authentication**: Firebase Admin SDK (Verifies ID Tokens from client).
- **Email**: SendGrid (`@sendgrid/mail`) - Transactional emails with QR codes.
- **Utils**: `qrcode` (Generation), `csv-parser` (Bulk Import).

### **Frontend (Client)**

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router) - Server-Side Rendering & Static Generation.
- **Styling**: Tailwind CSS v4 & Lucide React Icons.
- **State/Auth**: React Context + Firebase Client SDK.
- **HTTP Client**: Axios (Configured with Interceptors).

### **Staff App (PWA & Offline Protocol)**

The "Check-in Mode" is a fully functional **Progressive Web App (PWA)** designed for unstable network conditions.

- **Offline Storage**: [Dexie.js](https://dexie.org/) (IndexedDB Wrapper) - Stores thousands of attendees locally.
- **Sync Strategy**: **"Offline-First, Background Sync"**.
  1.  **Initial Load**: Downloads lightweight JSON of all attendees from `GET /events/:id/attendees/sync`.
  2.  **Scan**: Validates ticket against **local IndexedDB** (Instant feedback < 100ms).
  3.  **Action**: Marks attendee as `checkedIn` locally.
  4.  **Sync**:
      - _Online_: Pushes check-in to API immediately.
      - _Offline_: Queues the request.
      - _Reconnection_: Listens for `window.ononline` to flush the queue.

---

## 🛠️ Prerequisites

- **Node.js**: v18 or higher.
- **Docker**: Required for running the local PostgreSQL database.
- **Firebase Project**:
  - Authentication enabled (Email/Password provider).
  - Service Account JSON key (for Backend).
- **SendGrid Account**: API Key for sending emails (Optional for dev, required for prod).

---

## 🚀 Getting Started

### 1. Database Setup

Start the local PostgreSQL instance using Docker:

```bash
docker compose up -d
```

Initialize the database schema:

```bash
cd api
npx prisma db push
```

### 2. Environment Configuration

#### **Backend (`api/.env`)**

Create `api/.env` and configure your database and SendGrid keys:

```ini
PORT=3001
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/potenciarte?schema=public"

# Email Service (Optional for local dev)
SENDGRID_API_KEY="SG.your_key_here"
SENDGRID_FROM_EMAIL="invitaciones@yourdomain.com"
```

_Important: Place your `firebase-service-account.json` key file in the `api/` root directory._

#### **Frontend (`client/.env`)**

Create `client/.env` (or `.env.local`) with your Firebase Client configuration:

```ini
NEXT_PUBLIC_API_URL="http://localhost:3001"

# Firebase Config
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456..."
NEXT_PUBLIC_FIREBASE_APP_ID="1:123456..."
```

### 3. Running the Application

**Start Backend:**

```bash
cd api
npm run start:dev
# Server running on http://localhost:3001
```

**Start Frontend:**

```bash
cd client
npm run dev
# Client running on http://localhost:3000
```

---

## ✨ Features Guide

### 📅 Event Dashboard

- **Create Events**: Define Name, Date, Location, and Description.
- **Stats**: View real-time Total Attendees vs. Checked-in count.

### 👥 Attendee Management

- **Bulk Upload**: Upload a CSV file with columns: `name`, `email`, `rut` (optional).
- **Search**: Filter attendees by name or email.
- **Send Tickets**: Trigger email invitations. Each email contains a **Unique QR Code** signed with the Attendee ID.

### 📱 Staff Check-in App (PWA)

Access this mode by navigating to an event and clicking **"Check-in Mode"**.

1.  **Installable**: Add to Home Screen on iOS/Android.
2.  **QR Scanner**: Uses device camera to scan tickets.
3.  **Manual Search**: Type name/email to find guests without tickets.
4.  **Feedback System**:
    - ✅ **GREEN**: Access Granted.
    - ⚠️ **YELLOW**: Already Checked In (Duplicate scan).
    - ❌ **RED**: Invalid Ticket (Not found in this event).
5.  **Offline Mode**:
    - Disconnect internet -> Scan validation continues to work.
    - App shows "Offline" status but functionality remains 100%.
    - Syncs automatically when connection is restored.

---

## 📡 Key API Endpoints

| Method   | Endpoint                                       | Description                                 |
| :------- | :--------------------------------------------- | :------------------------------------------ |
| **GET**  | `/events`                                      | List all events                             |
| **POST** | `/events`                                      | Create new event                            |
| **GET**  | `/events/:id/attendees`                        | List attendees (Paginated/Search)           |
| **POST** | `/events/:id/attendees/upload`                 | Upload CSV                                  |
| **POST** | `/events/:id/attendees/:attendeeId/send-email` | Send QR Ticket                              |
| **GET**  | `/events/:id/attendees/sync`                   | **Lightweight JSON** for PWA Sync           |
| **POST** | `/events/:id/attendees/check-in`               | **Idempotent** Check-in (Safe for re-tries) |

---

## 📦 Deployment (Production)

### Database

- Provision a managed PostgreSQL instance (e.g., AWS RDS, Google Cloud SQL, Railway, Supabase).
- Update `DATABASE_URL` in `api/.env`.

### Backend

- Build: `npm run build`
- Start: `npm run start:prod`
- Ensure `firebase-service-account.json` is available in the production environment (or start passing it via ENV variables if refactoring allows).

### Frontend

- Build: `npm run build`
- Start: `npm run start`
- **PWA**: The build process automatically generates the Service Worker (`sw.js`) and `workbox` files in `public/`.

---

## 🤝 Contributing

1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/amazing-feature`).
3.  Commit changes (`git commit -m 'feat: Add amazing feature'`).
4.  Push to branch (`git push origin feature/amazing-feature`).
5.  Open a Pull Request.

---

**Developed by [Sporh Solutions]**
