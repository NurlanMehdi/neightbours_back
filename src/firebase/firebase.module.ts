import { Module } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { FirebasePushService } from './firebase-push.service';

@Module({
  providers: [FirebaseService, FirebasePushService],
  exports: [FirebaseService, FirebasePushService],
})
export class FirebaseModule {}
