import { Injectable } from '@nestjs/common';
import { DecodedIdToken } from 'firebase-admin/auth';
import * as admin from 'firebase-admin';

export enum Role {
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
  USER = 'USER',
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  isBlocked?: boolean;
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
      const userData = doc.data() as User;
      // Ensure custom claims are set if they were missing or mismatched
      if (userToken.role !== userData.role) {
        await admin.auth().setCustomUserClaims(uid, { role: userData.role });
      }
      return userData;
    }

    // Check if this is the first user to make them admin
    const usersSnapshot = await this.db.collection('users').get();
    const role = usersSnapshot.empty ? Role.ADMIN : Role.USER;

    const newUser: User = {
      id: uid,
      email: email || '',
      fullName: (name as string) || 'Unknown',
      role,
      isBlocked: false,
    };

    await userRef.set(newUser);
    await admin.auth().setCustomUserClaims(uid, { role });
    return newUser;
  }

  async findAll(): Promise<User[]> {
    const snapshot = await this.db.collection('users').get();
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return { id: doc.id, ...data } as User;
    });
  }

  async updateRole(uid: string, role: Role): Promise<void> {
    await this.db.collection('users').doc(uid).update({ role });
    await admin.auth().setCustomUserClaims(uid, { role });
  }

  async toggleBlock(uid: string, isBlocked: boolean): Promise<void> {
    await this.db.collection('users').doc(uid).update({ isBlocked });
  }
}
