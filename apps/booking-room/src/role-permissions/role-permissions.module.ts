import { Module } from '@nestjs/common';
import { RolePermissionService } from './role-permissions.service';
import { RolePermissionController } from './role-permissions.controller';
import { RolesModule } from '../roles/roles.module';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { CaslModule } from '../casl/casl.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { AbilitiesModule } from '../abilities/abilities.module';

@Module({
  imports: [
    JwtModule,
    UsersModule,
    RolesModule,
    CaslModule,
    PermissionsModule,
    AbilitiesModule,
  ],
  controllers: [RolePermissionController],
  providers: [RolePermissionService],
  exports: [RolePermissionService],
})
export class RolePermissionModule {}
