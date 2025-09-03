import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private app: admin.app.App;

  onModuleInit() {
    if (!admin.apps.length) {
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      let privateKey = process.env.FIREBASE_PRIVATE_KEY;

      if (!projectId || !clientEmail || !privateKey) {
        throw new Error('Firebase ENV variables are missing!');
      }

      // \n stringlərini real newline-a çeviririk
      privateKey = privateKey.replace(/\\n/g, '\n');

      this.app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });

      console.log('✅ Firebase initialized with project:', projectId);
    }
  }

  getAuth() {
    return admin.auth();
  }

  getFirestore() {
    return admin.firestore();
  }

  getMessaging() {
    return admin.messaging();
  }

  async verifyIdToken(idToken: string) {
    try {
      return await this.getAuth().verifyIdToken(idToken);
    } catch (error) {
      throw new Error('Invalid Firebase token: ' + error.message);
    }
  }

  async sendNotification(token: string, title: string, body: string) {
    try {
      return await this.getMessaging().send({
        notification: { title, body },
        token,
      });
    } catch (error) {
      throw new Error('Failed to send notification: ' + error.message);
    }
  }
}
