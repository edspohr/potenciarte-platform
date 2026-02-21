'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  role: string | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signInWithGoogle: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
});

const fetchOrCreateUserRole = async (user: User): Promise<string> => {
  const userRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userRef);

  if (userDoc.exists()) {
    return (userDoc.data()?.role as string) || 'STAFF';
  }

  // New user — create with STAFF role
  await setDoc(userRef, {
    email: user.email,
    displayName: user.displayName || '',
    role: 'STAFF',
    createdAt: new Date().toISOString(),
  });
  return 'STAFF';
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          // Always read true role from Firestore to prevent stale token claims from showing incorrect UI
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userRef);
          let firestoreRole: string | null = null;
          if (userDoc.exists()) {
             firestoreRole = userDoc.data().role as string;
          }

          let idTokenResult = await firebaseUser.getIdTokenResult();
          let userRole = idTokenResult.claims.role as string | undefined;

          // If the token's claim doesn't match Firestore (or is missing), force a backend sync
          if (userRole !== firestoreRole || !userRole) {
            const token = await firebaseUser.getIdToken();
            const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            
            // Trigger backend sync which sets the custom claim based on the Firestore doc
            await fetch(`${apiBase}/api/auth/login`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
            });

            // Force refresh the token to obtain the newly attached claims
            idTokenResult = await firebaseUser.getIdTokenResult(true);
            userRole = idTokenResult.claims.role as string | undefined;
            
            // If firestoreRole was null (new user), we should refetch it now that the backend created it
            if (!firestoreRole) {
               const newUserDoc = await getDoc(userRef);
               if (newUserDoc.exists()) firestoreRole = newUserDoc.data().role as string;
            }
          }

          setRole(firestoreRole || userRole || 'STAFF');
        } catch (error) {
          console.error('Error fetching/syncing user role:', error);
          setRole('STAFF');
        } finally {
          setLoading(false);
        }
      } else {
        setRole(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
    router.push('/dashboard');
  };

  const signUp = async (email: string, pass: string, name: string) => {
    const credential = await createUserWithEmailAndPassword(auth, email, pass);
    // Create user doc with STAFF role and display name
    await setDoc(doc(db, 'users', credential.user.uid), {
      email,
      displayName: name,
      role: 'STAFF',
      createdAt: new Date().toISOString(),
    });
    router.push('/dashboard');
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const credential = await signInWithPopup(auth, provider);
    // fetchOrCreateUserRole handles new vs existing Google users
    await fetchOrCreateUserRole(credential.user);
    router.push('/dashboard');
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setRole(null);
    router.push('/login');
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, signIn, signUp, signInWithGoogle, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
