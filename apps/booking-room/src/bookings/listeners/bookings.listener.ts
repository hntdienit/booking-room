import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { BookingEventEnum } from '../bookingEvent.enum';
import {
  rejectBookingEvent,
  pendingBookingEvent,
} from '../events/bookings.event';
import { BookingsService } from '../bookings.service';
import { Status } from '@prisma/client';
import { sendMailEvent } from '../../mail/events/sendMail.event';
import { ConfigService } from '@nestjs/config';
import { MailEventEnum } from '../../mail/mail.enum';
import { MSG_ERROR_ROOM_ALREADY_BOOKED } from '../../constants/message.constant';

@Injectable()
export class bookingListener {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private readonly logger = new Logger(bookingListener.name);

  @OnEvent(BookingEventEnum.rejectListener)
  async rejectBookingOverlap(event: rejectBookingEvent) {
    try {
      const existBookingPending =
        await this.bookingsService.existBookingOverlap({
          startTime: event.booking.startTime,
          endTime: event.booking.endTime,
          roomId: event.booking.roomId,
          status: Status.pending,
        });

      for (let i = 0; i < existBookingPending.length; i++) {
        const pendingBookingOverlap = await this.bookingsService.updateData({
          where: { id: existBookingPending[i].id },
          data: {
            status: Status.reject,
            rejectedReason: MSG_ERROR_ROOM_ALREADY_BOOKED,
            modifiedByAdminId: event.adminId,
          },
          include: { createdByUser: { select: { email: true } } },
        });

        const sendMail = new sendMailEvent();
        sendMail.email = pendingBookingOverlap.createdByUser.email;
        sendMail.subject = 'Booking request result';
        sendMail.template = './booking-request-result';
        sendMail.context = {
          rejected: true,
          url: `${this.configService.get('CLIENT_HOST')}/booking-details/${
            pendingBookingOverlap.id
          }`,
          rejectedReason: pendingBookingOverlap.rejectedReason,
        };

        this.eventEmitter.emit(MailEventEnum.sendMailListener, sendMail);
      }
    } catch (err) {
      this.logger.error(err);
    }
  }

  @OnEvent(BookingEventEnum.pendingListener)
  async pendingBookingWhenRoomDisable(event: pendingBookingEvent) {
    await this.bookingsService.pendingBookingWhenRoomDisable(event);
  }
}
