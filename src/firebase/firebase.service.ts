import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private app: admin.app.App;

  onModuleInit() {
    if (!admin.apps.length) {
      this.app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: 'project-1532338643756643649',
          clientEmail:
            'firebase-adminsdk-fbsvc@project-1532338643756643649.iam.gserviceaccount.com',
          privateKey: `-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQCp/1J5vKlEvlnF\nBfVIJV5Xl/PXMsGaeELI9BrAjD+nsLrfDE7YyMjk2kYI9JqsgpH+VXGLpzbAn50i\nHyUuD3zkEGwV3EdnuZBqdW07xRoLyVJk9ew1PvQQqHFI5rV+eYt6eYjnHfv/zLZg\n3SQdDYS5KeZ99EJvsVM/dzzXvWeY5RlEh33YvU31ykHWHNWn433MhnpzNb4olUuR\na8ls6lRf7BYhWy/kx3w54IuxYKMVyFmEPLB5/VbDPtErtKDaml4Ucgr0H3kgFVdT\nx4o2ra1VnmpW6GfqY7DfzzUinUGuwpPPFABmXbbMpFuhLY9WPEjx5MKSg/CSwvoy\nkKdEXomVAgMBAAECggEAD/38LwYbwWML1GBVXQpg5+ocTw4QDv1JwRhPrPX0pgyW\n49VHVJb86SSMipqiM2DcJZo5ooriOHg7gsJ9z6m21MijtmHA2OXoy08NLd6CrwGr\nLeLBrBemQ6vo7lP/1mxOPgERazaTppKGRLIBC/eh2P5zV72DA3lhzLpln6EKjiQ1\ntcqEPyYxAW3QM3FBQYeBx+rHoIOKXmeMrZ8UgWN5iKwDUfGPWZ0kEzGbFOCGuKVq\noCK3eE1oenmHorneRk/Spc7Qt7XgkzeOGCChxG2FN0uidNH3xecC4EDWOj0P6mB5\n7jP82LzOAec7qYlvv10izxVcdElpMw12WzQFJowaGQKBgQDrRDOyY22OQkdgCZhF\n95JQXeECJtsRWMLpTseb/N7p/nvaakFH9yJU8RVK6wOMzyIcJGzA9YRZEdRLH/Cy\n5rkVAPC4jopzjA7qm2iloTAEqXFdRWwMhpIJ3egVE2eZL3tPgv2wtGWScwufUQaZ\nOinOIPCFYyRjFYE7qaI5gbmETQKBgQC4+pkdrWlnVc0erozmMLIJscQPaMJnjbsb\nUkuP4TdsPjmUMTm4oFcHxnS6ctCUTTmdUk2UejYLTpyV4FpTcsKSCYKRBdtu2yNn\nvX/wclm0ToGU3w8lwgXgdt/z8su5+x1wuCzQksoieQpUXqO/QW/43FhW0cPfemKP\nyI9oyP9eaQKBgQDd91LvE2/hsBa3PVY1bQbWXDxWU2KMUzpR9MnPGh0Wl8synt1I\nkJoLmgmEzYZj62k7NAKHaxybDH9HAbOOlrA4aNK0zYdCzPmlz0pEOnebbmJOpZjz\nmGNge8TjXZN4q5ujwOqpNQo/ydtFTKT1HDMlD17d+lPyR+/N4pXzu7jUYQKBgQCe\n3ACBXzslVqeJEQjKa8mKz9L8FNDYE/07coqYLyfk2u+iGEBlEbaMY+A9e3sr0cKI\nHHWp7ObbAREzGfEYt3bn6ijqmSghZStb3X+xpNLrKXzZuFMO7zkS06RzofFacJGR\nC2rZWSclQeQgHwLrrqwWAk4Piah5FWbt6qVWrT+6+QKBgQDYmHArdIAnWBiqM4v1\nHdszRqHVsiJITkBRJZKbOTo2RhxHGq3+Zf4xHQ6KmEizHPOAcTPCrRgYYchdPWXH\n4pz2SXUl6WQJYcHaal27lL+7VzAa+sJ8ivdWVEYaqCFdGNT/kTycNqM84iXXCxQV\ny6UdIWMkSu0Np1d7mrXps3JBCg==\n-----END PRIVATE KEY-----\n`,
        }),
      });

      console.log(
        '✅ Firebase initialized with project:',
        'project-1532338643756643649',
      );
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
    return this.getAuth().verifyIdToken(idToken);
  }

  async sendNotification(token: string, title: string, body: string) {
    return this.getMessaging().send({
      notification: { title, body },
      token,
    });
  }
}
