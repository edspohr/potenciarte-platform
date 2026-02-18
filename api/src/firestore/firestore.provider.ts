import * as admin from 'firebase-admin';

export const FIRESTORE_PROVIDER = 'FIRESTORE';

export const firestoreProvider = {
  provide: FIRESTORE_PROVIDER,
  useFactory: (): admin.firestore.Firestore => {
    return admin.firestore();
  },
};
