import { Module, forwardRef } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../mail/mail.module';
import { RoomsModule } from '../rooms/rooms.module';
import { bookingListener } from './listeners/bookings.listener';
import { BookingCron } from './cron/bookings.cron';
import { CaslModule } from '../casl/casl.module';

@Module({
  imports: [
    JwtModule,
    UsersModule,
    forwardRef(() => RoomsModule),
    MailModule,
    CaslModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService, bookingListener, BookingCron],
  exports: [BookingsService],
})
export class BookingsModule {}
