import { getApps, initializeApp, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const apps = getApps();
let app: App;

if (apps.length === 0) {
  app = initializeApp({
    projectId: firebaseConfig.projectId,
  });
} else {
  app = apps[0];
}

export const adminAuth = getAuth(app);
