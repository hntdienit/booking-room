import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { FilesModule } from '../files/files.module';
import { MailModule } from '../mail/mail.module';
import { filesListener } from '../files/listeners/files.listener';
import { CaslModule } from '../casl/casl.module';

@Module({
  imports: [JwtModule, FilesModule, MailModule, CaslModule],
  controllers: [UsersController, ProfileController],
  providers: [UsersService, ProfileService, filesListener],
  exports: [UsersService],
})
export class UsersModule {}
