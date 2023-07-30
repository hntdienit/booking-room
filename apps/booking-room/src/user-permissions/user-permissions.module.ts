import { Module } from '@nestjs/common';
import { UserPermissionsService } from './user-permissions.service';
import { UserPermissionsController } from './user-permissions.controller';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { CaslModule } from '../casl/casl.module';
import { RolePermissionModule } from '../role-permissions/role-permissions.module';

@Module({
  imports: [
    JwtModule,
    UsersModule,
    CaslModule,
    RolePermissionModule,
  ],
  controllers: [UserPermissionsController],
  providers: [UserPermissionsService],
  exports: [UserPermissionsService],
})
export class UserPermissionsModule {}
