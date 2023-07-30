import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BookingsService } from '../bookings.service';

@Injectable()
export class BookingCron {
  constructor(private readonly bookingsService: BookingsService) {}

  private readonly logger = new Logger(BookingCron.name);

  @Cron(CronExpression.EVERY_10_MINUTES)
  async autoRejectBookingEndTimeLessNow() {
    try {
      await this.bookingsService.rejectBookingEndTimeLessNow();
    } catch (err) {
      this.logger.error(err);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async autoDeleteRejectOrCancelBookingOlderThanWeek() {
    try {
      await this.bookingsService.deleteRejectOrCancelBookingOlderThanWeek();
    } catch (err) {
      this.logger.error(err);
    }
  }
}
