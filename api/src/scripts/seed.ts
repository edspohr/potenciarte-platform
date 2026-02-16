import { ServiceAccount } from 'firebase-admin';
import * as admin from 'firebase-admin';
import { PrismaClient, Role } from '@prisma/client';
import * as path from 'path';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding users...');

  // 1. Initialize Firebase Admin
  const serviceAccountPath = path.resolve(
    __dirname,
    '../../firebase-service-account.json',
  );

  if (!fs.existsSync(serviceAccountPath)) {
    console.error('Firebase service account not found at:', serviceAccountPath);
    process.exit(1);
  }

  const serviceAccount = JSON.parse(
    fs.readFileSync(serviceAccountPath, 'utf8'),
  ) as ServiceAccount;

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  const users = [
    {
      email: 'admin@potenciarte.cl',
      password: '123456',
      fullName: 'Admin User',
      role: Role.ADMIN,
    },
    {
      email: 'staff@potenciarte.cl',
      password: '123456',
      fullName: 'Staff User',
      role: Role.STAFF,
    },
  ];

  for (const user of users) {
    let uid = '';

    try {
      // Check if user exists in Firebase
      try {
        const firebaseUser = await admin.auth().getUserByEmail(user.email);
        uid = firebaseUser.uid;
        console.log(
          `User ${user.email} found in Firebase (UID: ${uid}). Updating password...`,
        );
        await admin.auth().updateUser(uid, {
          password: user.password,
        });
      } catch (error: unknown) {
        // Cast error to any to check code property safely-ish, or use a better type guard
        const firebaseError = error as { code?: string };
        if (firebaseError.code === 'auth/user-not-found') {
          console.log(`User ${user.email} not found in Firebase. Creating...`);
          const newUser = await admin.auth().createUser({
            email: user.email,
            password: user.password,
            displayName: user.fullName,
          });
          uid = newUser.uid;
        } else {
          throw error;
        }
      }

      // Upsert in Prisma
      console.log(`Upserting user ${user.email} in Database...`);
      await prisma.user.upsert({
        where: { email: user.email },
        update: {
          fullName: user.fullName,
          role: user.role,
        },
        create: {
          id: uid,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
      });

      console.log(`✅ Processed ${user.email}`);
    } catch (error) {
      console.error(`Error processing ${user.email}:`, error);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
