import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe, InternalServerErrorException } from '@nestjs/common';
import * as express from 'express';
import * as admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Initialize Firebase Admin (Shared)
function initializeFirebase() {
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
        // In Cloud Functions environment, specific creds might not be needed if relying on default identity
        console.warn(
          'Service account file not found, checking default credentials...',
        );
        credential = admin.credential.applicationDefault();
      }
    } catch (error) {
      console.warn('Firebase init warning:', error);
      credential = admin.credential.applicationDefault();
    }

    admin.initializeApp({ credential });
  }
}

// Standalone Bootstrap (Local Dev)
async function bootstrap() {
  initializeFirebase();
  const app = await NestFactory.create(AppModule);

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Enable CORS
  app.enableCors({
    origin: true, // Allow all origins for debugging
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Server running on port ${port}`);
}

// Check if running in Cloud Functions (heuristics or specific env var could be used)
// For now, we keep bootstrap() for local dev.
if (require.main === module) {
  void bootstrap();
}

// Export for Cloud Functions
export const createNestServer = async (expressInstance: express.Express) => {
  initializeFirebase();
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressInstance),
  );
  app.enableCors({
    origin: [
      'https://potenciarte-platform-v1.web.app',
      'https://potenciarte-platform-v1.firebaseapp.com', // Firebase creates this alias too
      'http://localhost:3000',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  await app.init();
  return app;
};
