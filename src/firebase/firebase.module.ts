import { Module } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { FirebasePushService } from './firebase-push.service';
import { UsersModule } from '../modules/users/users.module';

@Module({
  imports: [UsersModule],
  providers: [FirebaseService, FirebasePushService],
  exports: [FirebaseService, FirebasePushService],
})
export class FirebaseModule {}
