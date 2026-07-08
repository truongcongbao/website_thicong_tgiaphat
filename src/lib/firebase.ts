import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, setDoc, DocumentReference, deleteDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true
}, firebaseConfig.firestoreDatabaseId);
export const googleAuthProvider = new GoogleAuthProvider();

export function cleanObject(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(cleanObject);
  }
  const cleaned: any = {};
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (value !== undefined) {
      cleaned[key] = cleanObject(value);
    }
  }
  return cleaned;
}

export async function safeSetDoc(docRef: DocumentReference<any, any>, data: any) {
  return setDoc(docRef, cleanObject(data));
}

export async function safeDeleteDoc(docRef: DocumentReference<any, any>) {
  try {
    return await deleteDoc(docRef);
  } catch (err) {
    console.error("Firebase Firestore deleteDoc error: ", err);
    throw err;
  }
}
