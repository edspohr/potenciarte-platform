import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config();

// Determine environment specific config if needed
// For local execution of this script, we need to initialize the app.
// If this script is run via `ts-node src/scripts/seed.ts` it needs credentials.

const serviceAccountPath = path.resolve(
  __dirname,
  '../../firebase-service-account.json',
);

if (!admin.apps.length) {
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(
      fs.readFileSync(serviceAccountPath, 'utf8'),
    ) as admin.ServiceAccount;
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID || 'potenciarte-platform-v1',
    });
  } else {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: process.env.FIREBASE_PROJECT_ID || 'potenciarte-platform-v1',
    });
  }
}

const db = admin.firestore();

// Role definition locally since we can't easily import from NestJS service in a standalone script without context
enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
}

async function main() {
  const users = [
    {
      email: 'admin@potenciarte.cl',
      name: 'Admin User',
      role: Role.ADMIN,
      uid: 'admin-uid-placeholder',
    },
    {
      email: 'staff@potenciarte.cl',
      name: 'Staff User',
      role: Role.STAFF,
      uid: 'staff-uid-placeholder',
    },
  ];

  console.log('Seeding users...');

  // Note: specific User seeding for Firestore is often not needed as users are created via Auth
  // But we can create the user documents.

  for (const user of users) {
    // We use email as ID for simplicity in this seed if UID is not known,
    // but in real app we use UID.
    // Skipping actual user doc creation to avoid confusion with Auth UIDs.
    console.log(`Skipping user doc creation for ${user.email} (Auth managed)`);
  }

  console.log('Seeding Events...');

  const events = [
    {
      name: 'Evento de Prueba',
      eventDate: new Date('2024-12-25').toISOString(),
      location: 'Centro de Eventos',
      description: 'Un evento de prueba para verificar el sistema.',
      status: 'PUBLISHED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  for (const event of events) {
    const res = await db.collection('events').add(event);
    console.log(`Created event: ${event.name} with ID: ${res.id}`);

    // Add some attendees
    const attendees = [
      {
        name: 'Juan Pérez',
        email: 'juan@example.com',
        rut: '1-9',
        checkedIn: false,
        ticketSent: false,
        diplomaSent: false,
      },
      {
        name: 'María López',
        email: 'maria@example.com',
        rut: '2-7',
        checkedIn: false,
        ticketSent: false,
        diplomaSent: false,
      },
    ];

    const batch = db.batch();
    const attendeesRef = db
      .collection('events')
      .doc(res.id)
      .collection('attendees');

    for (const att of attendees) {
      const ref = attendeesRef.doc();
      batch.set(ref, {
        ...att,
        eventId: res.id,
        createdAt: new Date().toISOString(),
      });
    }
    await batch.commit();
    console.log(`Added ${attendees.length} attendees to event ${res.id}`);
  }

  console.log('Seeding finished.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
