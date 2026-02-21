import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import * as admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Initialize Firebase Admin (Shared)
// Initialize Firebase Admin (Shared)
function initializeFirebase() {
  if (!admin.apps.length) {
    let credential;
    // Try to find the service account file
    const serviceAccountPath = path.join(
      __dirname,
      '..',
      'firebase-service-account.json',
    );
    
    // Explicitly define the Project ID (Fallback to a hardcoded string if env is missing to be safe)
    const projectId = process.env.FIREBASE_PROJECT_ID || 'potenciarte-platform-v1';

    try {
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

    // Initialize with explicit projectId
    admin.initializeApp({ 
      credential,
      projectId: projectId 
    });
    console.log(`🔥 Firebase Admin Initialized for project: ${projectId}`);
  }
}

// Standalone Bootstrap (Local Dev)
async function bootstrap() {
  initializeFirebase();
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false, // Allow extra fields for now
      transform: true,
      exceptionFactory: (errors) => {
        console.log('Validation errors:', JSON.stringify(errors, null, 2));
        return new ValidationPipe().createExceptionFactory()(errors);
      },
    }),
  );

  // Enable CORS
  app.enableCors({
    origin: [
      'https://potenciarte-platform-v1.web.app',
      'https://potenciarte-platform-v1.firebaseapp.com',
      'http://localhost:3000',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  const port = process.env.PORT ?? 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`Server running on port ${port} (0.0.0.0)`);
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
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: [
      'https://potenciarte-platform-v1.web.app',
      'https://potenciarte-platform-v1.firebaseapp.com',
      'http://localhost:3000',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Enable validation in production
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  await app.init();
  return app;
};
