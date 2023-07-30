import { Module } from '@nestjs/common';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { CaslModule } from '../casl/casl.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { AbilitiesModule } from '../abilities/abilities.module';

@Module({
  imports: [
    JwtModule,
    UsersModule,
    CaslModule,
    PermissionsModule,
    AbilitiesModule,
  ],
  controllers: [RolesController],
  providers: [RolesService],
  exports: [RolesService],
})
export class RolesModule {}
