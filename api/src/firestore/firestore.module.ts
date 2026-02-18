import { Module, Global } from '@nestjs/common';
import { firestoreProvider } from './firestore.provider';

@Global()
@Module({
  providers: [firestoreProvider],
  exports: [firestoreProvider],
})
export class FirestoreModule {}
