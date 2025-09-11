import { Module, forwardRef } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { FirebasePushService } from './firebase-push.service';
import { UsersModule } from '../modules/users/users.module';

@Module({
  imports: [forwardRef(() => UsersModule)],
  providers: [FirebaseService, FirebasePushService],
  exports: [FirebaseService, FirebasePushService],
})
export class FirebaseModule {}
