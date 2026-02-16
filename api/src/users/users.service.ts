import { Injectable } from '@nestjs/common';
import { DecodedIdToken } from 'firebase-admin/auth';
import * as admin from 'firebase-admin';

export enum Role {
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
}

@Injectable()
export class UsersService {
  private db: admin.firestore.Firestore;

  constructor() {
    this.db = admin.firestore();
  }

  async syncProfile(userToken: DecodedIdToken): Promise<User> {
    const { uid, email, name } = userToken;
    const userRef = this.db.collection('users').doc(uid);
    const doc = await userRef.get();

    if (doc.exists) {
      return doc.data() as User;
    }

    // Check if this is the first user to make them admin
    const usersSnapshot = await this.db.collection('users').get();
    const role = usersSnapshot.empty ? Role.ADMIN : Role.STAFF;

    const newUser: User = {
      id: uid,
      email: email || '',
      fullName: (name as string) || 'Unknown',
      role,
    };

    await userRef.set(newUser);
    return newUser;
  }
}
