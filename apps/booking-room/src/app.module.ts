import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MailModule } from './mail/mail.module';
import { RoomsModule } from './rooms/rooms.module';
import PrismaClientExceptionFilter from './prisma/prisma-client-exception.filter';
import { BookingsModule } from './bookings/bookings.module';
import { CacheModule } from '@nestjs/cache-manager';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { AbilitiesModule } from './abilities/abilities.module';
import { RolePermissionModule } from './role-permissions/role-permissions.module';
import { CaslModule } from './casl/casl.module';
import { UserPermissionsModule } from './user-permissions/user-permissions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    MailModule,
    EventEmitterModule.forRoot(),
    RoomsModule,
    BookingsModule,
    ScheduleModule.forRoot(),
    CacheModule.register({
      isGlobal: true,
      ttl: parseInt(process.env.CACHE_TTL) * 1000,
      max: parseInt(process.env.CACHE_MAX),
    }),
    RolesModule,
    PermissionsModule,
    AbilitiesModule,
    RolePermissionModule,
    CaslModule,
    UserPermissionsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: PrismaClientExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },
  ],
})
export class AppModule {}
