import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import configuration from './config/configuration';
import { validationSchema } from './config/env.validation';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { EventsModule } from './modules/events/events.module';
import { JwtService } from '@nestjs/jwt';
import { CommunityModule } from './modules/communities/community.module';
import { PropertiesModule } from './modules/properties/properties.module';
import { PropertyResourcesModule } from './modules/property-resources/property-resources.module';
import { AiChatModule } from './modules/ai-chat/ai-chat.module';
import { GeoModerationModule } from './modules/geo-moderation/geo-moderation.module';
import { EventCategoriesModule } from './modules/event-categories/event-categories.module';
import { QualificationsModule } from './modules/qualifications/qualifications.module';
import { ProductsModule } from './modules/products/products.module';
import { FamilyTypesModule } from './modules/family-types/family-types.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { FirebaseModule } from './firebase/firebase.module';
import { PrivateChatModule } from './modules/private-chat/private-chat.module';
import { CommunityChatModule } from './modules/community-chat/community-chat.module';
import { ChatAdminModule } from './modules/chat-admin/chat-admin.module';
import { MessagesModule } from './modules/messages/messages.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    CommunityModule,
    EventsModule,
    PropertiesModule,
    PropertyResourcesModule,
    AiChatModule,
    GeoModerationModule,
    EventCategoriesModule,
    QualificationsModule,
    ProductsModule,
    FamilyTypesModule,
    DocumentsModule,
    NotificationsModule,
    FirebaseModule, // ← BU SATIRI EKLEYİN
    PrivateChatModule,
    CommunityChatModule,
    ChatAdminModule,
    MessagesModule,
  ],
  controllers: [],
  providers: [JwtService],
})
export class AppModule {}
