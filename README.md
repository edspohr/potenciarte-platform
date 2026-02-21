# Potenciarte Platform 🚀

**A high-performance Event Management Platform** built for handling large-scale corporate events. It seamlessly manages the entire event lifecycle: from guest list management, QR-ticket issuance via email, to real-time on-site staff check-ins using a fully online Cloud infrastructure.

---

## 🏗️ Architecture & Tech Stack

The platform uses a **Monorepo** structure separating the Backend API and Frontend Client, both deployed to Google Cloud Run and Firebase.

### **Backend (API)**

- **Framework**: [NestJS](https://nestjs.com/) (Node.js) - Modular and scalable architecture.
- **Database**: [Firestore](https://firebase.google.com/docs/firestore) - NoSQL document database.
- **Authentication**: Firebase Admin SDK (**Role-Based Access via Custom Claims** to avoid database lookups).
- **Search Optimization**: Native Firestore prefix searching for lightning-fast queries.
- **Email**: SendGrid (`@sendgrid/mail`) - Transactional emails with QR codes.
- **Utils**: `qrcode` (Generation), `csv-parser` (**Stream-based** processing for low memory footprint during Bulk Imports).

### **Frontend (Client)**

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router) - Server-Side Rendering & Static Generation.
- **Deployment Strategy**: **Standalone Docker Container** deployed to Cloud Run, proxied via Firebase Hosting Rewrites.
- **Styling**: Tailwind CSS v4 & Lucide React Icons.
- **State/Auth**: React Context + Firebase Client SDK with Custom Claims Sync.
- **HTTP Client**: Axios (Configured with Interceptors).

### **Staff Check-In App**

The "Check-in Mode" is a fast, responsive Single Page Application view designed for staff at the door.

- **Real-Time Validation**: Staff scans a QR code which makes a swift API call to the Cloud Run backend to validate the ticket against the live Firestore Database.
- **Instant Sync**: Since it operates 100% online, all staff members instantly see when a ticket has been consumed, preventing duplicate entries across multiple doors.
- **Manual Search**: Fallback system to search for users by name, email, or RUT in real-time.

_(Note: The previous offline PWA architectural approach was removed to favor this much simpler, highly-available online model)._

---

## 🛠️ Prerequisites

- **Node.js**: v20 or higher (strict requirement for Next.js 16/Firebase).
- **Firebase Project**:
  - Authentication enabled (Email/Password provider).
  - Service Account JSON key (for Backend).
- **SendGrid Account**: API Key for sending emails.

---

## 🚀 Getting Started (Local Development)

### 1. Environment Configuration

#### **Backend (`api/.env`)**

Create `api/.env` and configure your Firebase and SendGrid keys:

```ini
PORT=8080
# Email Service
SENDGRID_API_KEY="SG.your_key_here"
SENDGRID_FROM_EMAIL="invitaciones@yourdomain.com"
```

_Important: Place your `firebase-service-account.json` key file in the `api/` root directory._

#### **Frontend (`client/.env.local`)**

Create `client/.env.local` with your Firebase Client configuration:

```ini
NEXT_PUBLIC_API_URL="http://localhost:8080"

# Firebase Config
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456..."
NEXT_PUBLIC_FIREBASE_APP_ID="1:123456..."
```

### 2. Running the Application

**Start Backend:**

```bash
cd api
npm run start:dev
# Server running on http://localhost:8080
```

**Start Frontend:**

```bash
cd client
npm run dev
# Client running on http://localhost:3000
```

---

## 📦 Deployment (Production)

This project includes automated deployment scripts for Google Cloud Push deploying.

1. Ensure the `gcloud` CLI is authenticated and your Firebase CLI is logged in.
2. Ensure you have the `.env.production` files complete.
3. For deploying the Backend API:
   ```bash
   ./deploy-infrastructure.sh
   ```
4. For deploying the Frontend Client (Next.js Docker + Firebase Hosting Proxies):
   ```bash
   ./deploy-client.sh
   ```

---

## 🤝 Contributing

1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/amazing-feature`).
3.  Commit changes (`git commit -m 'feat: Add amazing feature'`).
4.  Push to branch (`git push origin feature/amazing-feature`).
5.  Open a Pull Request.

---

**Developed by Ed Spohr**
