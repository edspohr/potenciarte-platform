import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // Enable CORS for Frontend communication

  // Initialize Firebase Admin
  // In production, use service account. locally, it might use default credentials or emulator
  if (!admin.apps.length) {
    let credential;
    try {
      const serviceAccountPath = path.join(
        __dirname,
        '..',
        'firebase-service-account.json',
      );
      if (fs.existsSync(serviceAccountPath)) {
        const serviceAccount = JSON.parse(
          fs.readFileSync(serviceAccountPath, 'utf8'),
        ) as ServiceAccount;
        credential = admin.credential.cert(serviceAccount);
      } else {
        throw new Error('File not found');
      }
    } catch (error) {
      console.warn(
        'Firebase Service Account check failed (local path), falling back to default credentials:',
        error,
      );
      credential = admin.credential.applicationDefault();
    }

    admin.initializeApp({
      credential,
    });
  }

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
