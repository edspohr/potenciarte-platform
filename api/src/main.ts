import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as admin from 'firebase-admin';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Initialize Firebase Admin
  // In production, use service account. locally, it might use default credentials or emulator
  if (!admin.apps.length) {
    let credential;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const serviceAccount = require('../firebase-service-account.json');
      credential = admin.credential.cert(serviceAccount);
    } catch {
      credential = admin.credential.applicationDefault();
    }

    admin.initializeApp({
      credential,
    });
  }

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
