import {
  BadRequestException,
  Inject,
  Injectable,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RequestUserDto } from '../users/dto/requestUser.dto';
import { CreateBookingDto } from './dto/createBooking.dto';
import {
  MSG_CANCEL_BOOKING_SUCCESSFULLY,
  MSG_CREATE_BOOKING_SUCCESSFULLY,
  MSG_ERROR_ROOM_ALREADY_BOOKED,
  MSG_ERROR_ROOM_BOOKED_TIME_HAS_EXPIRED,
  MSG_ERROR_ROOM_DISABLE,
  MSG_ERROR_YOU_ONLY_CANCEL_NOT_STARTED_BOOKING,
  MSG_ERROR_YOU_ONLY_CANCEL_PENDING_OR_APPROVED_BOOKING,
  MSG_ERROR_YOU_ONLY_EDIT_PENDING_BOOKING,
  MSG_ERROR_YOU_ONLY_EDIT_YOUR_BOOKING,
  MSG_UPDATE_BOOKING_SUCCESSFULLY,
} from '../constants/message.constant';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { sendMailEvent } from '../mail/events/sendMail.event';
import { ConfigService } from '@nestjs/config';
import { MailEventEnum } from '../mail/mail.enum';
import { RoomsService } from '../rooms/rooms.service';
import { FilterBookingDto } from './dto/filterBooking.dto';
import { UserUpdateBookingDto } from './dto/userUpdateBooking.dto';
import { AdminConfirmBookingDto } from './dto/adminConfirmBooking.dto';
import { Status } from '@prisma/client';
import {
  pendingBookingEvent,
  rejectBookingEvent,
} from './events/bookings.event';
import { BookingEventEnum } from './bookingEvent.enum';
import {
  OneHour,
  RejectedBookingRequestDeletedLimit,
} from '../constants/common.constant';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { BOOKING_CACHE } from '../constants/cache.constant';
import { CrudService } from '../crud/crud.service';
import { CalendarBookingDto } from './dto/calendarBooking.dto';
import dayjs from 'dayjs';
import { PermissionsCodeEnum } from '../permissions/permissions.enum';
import { AbilitiesCodeEnum } from '../abilities/abilities.enum';
import utc from 'dayjs/plugin/utc';

@Injectable()
export class BookingsService extends CrudService {
  constructor(
    protected readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => RoomsService))
    private readonly roomsService: RoomsService,
    private readonly eventEmitter: EventEmitter2,
    @Inject(CACHE_MANAGER) protected readonly cacheManager: Cache,
  ) {
    super(prisma, cacheManager, BOOKING_CACHE);
  }

  async existBookingOverlap(args: {
    startTime: Date;
    endTime: Date;
    roomId: number;
    status: Status;
  }) {
    const existBookingOverlap = await this.foundByWhere({
      where: {
        OR: [
          {
            startTime: { lte: args.startTime },
            endTime: { gte: args.endTime },
          },
          { startTime: { gte: args.startTime, lt: args.endTime } },
          { endTime: { gt: args.startTime, lte: args.endTime } },
        ],
        status: args.status,
        roomId: args.roomId,
      },
      include: { createdByUser: { select: { email: true } } },
    });

    return existBookingOverlap;
  }

  async createBooking(
    user: RequestUserDto,
    createBookingDto: CreateBookingDto,
  ) {
    const findRoom = await this.roomsService.foundById({
      id: createBookingDto.roomId,
    });

    if (!findRoom.isEnable) {
      throw new BadRequestException(MSG_ERROR_ROOM_DISABLE);
    }

    const existBookingApproved = await this.existBookingOverlap({
      startTime: createBookingDto.startTime,
      endTime: createBookingDto.endTime,
      roomId: createBookingDto.roomId,
      status: Status.approved,
    });

    if (existBookingApproved.length !== 0) {
      throw new BadRequestException(MSG_ERROR_ROOM_ALREADY_BOOKED);
    }

    const isRolePermissionChangeStatus =
      await this.prisma.rolePermission.findMany({
        where: {
          roleId: user.roleId,
          permission: {
            code: PermissionsCodeEnum.BookingRequest,
          },
          ability: { code: AbilitiesCodeEnum.Update },
        },
      });

    const newBooking = await this.createData({
      data: {
        startTime: createBookingDto.startTime,
        endTime: createBookingDto.endTime,
        reason: createBookingDto.reason,
        status:
          isRolePermissionChangeStatus.length !== 0
            ? Status.approved
            : Status.pending,
        roomId: findRoom.id,
        createdByUserId: user.id,
        modifiedByAdminId:
          isRolePermissionChangeStatus.length !== 0 ? user.id : null,
      },
    });

    if (isRolePermissionChangeStatus.length === 0) {
      const findUsers = await this.prisma.rolePermission.findMany({
        where: {
          permission: {
            code: PermissionsCodeEnum.BookingRequest,
          },
          ability: { code: AbilitiesCodeEnum.Update },
        },
        include: { role: { include: { user: true } } },
      });

      findUsers.map((item) => {
        item.role.user.map((user) => {
          const sendMail = new sendMailEvent();
          sendMail.email = user.email;
          sendMail.subject = 'Confirm booking';
          sendMail.template = './confirm-booking';
          sendMail.context = {
            url: `${this.configService.get('CLIENT_HOST')}/confirm-booking/${
              newBooking.id
            }`,
          };
          this.eventEmitter.emit(MailEventEnum.sendMailListener, sendMail);
        });
      });
    }

    if (isRolePermissionChangeStatus.length !== 0) {
      const rejectBooking = new rejectBookingEvent();
      rejectBooking.booking = newBooking;
      rejectBooking.adminId = user.id;

      this.eventEmitter.emit(BookingEventEnum.rejectListener, rejectBooking);
    }

    return {
      message: MSG_CREATE_BOOKING_SUCCESSFULLY,
    };
  }

  async getListBooking(filterBookingDto: FilterBookingDto) {
    const lists = await this.getList({ filterCrudDto: filterBookingDto });

    return lists;
  }

  async userUpdateBooking(
    id: number,
    user: RequestUserDto,
    userUpdateBookingDto: UserUpdateBookingDto,
  ) {
    const findBooking = await this.foundById({ id });

    if (findBooking.createdByUserId !== user.id) {
      throw new BadRequestException(MSG_ERROR_YOU_ONLY_EDIT_YOUR_BOOKING);
    }

    if (findBooking.status !== Status.pending) {
      throw new BadRequestException(MSG_ERROR_YOU_ONLY_EDIT_PENDING_BOOKING);
    }

    if (userUpdateBookingDto.roomId) {
      const findRoom = await this.roomsService.foundById({
        id: userUpdateBookingDto.roomId,
      });

      if (!findRoom.isEnable) {
        throw new BadRequestException(MSG_ERROR_ROOM_DISABLE);
      }
    }

    if (
      userUpdateBookingDto.startTime ||
      userUpdateBookingDto.endTime ||
      userUpdateBookingDto.roomId
    ) {
      const existBookingApproved = await this.existBookingOverlap({
        startTime: userUpdateBookingDto.startTime ?? findBooking.startTime,
        endTime: userUpdateBookingDto.endTime ?? findBooking.endTime,
        roomId: userUpdateBookingDto.roomId ?? findBooking.roomId,
        status: Status.approved,
      });

      if (existBookingApproved.length !== 0) {
        throw new BadRequestException(MSG_ERROR_ROOM_ALREADY_BOOKED);
      }
    }

    await this.updateData({
      where: { id },
      data: userUpdateBookingDto,
    });

    return {
      message: MSG_UPDATE_BOOKING_SUCCESSFULLY,
    };
  }

  async getBookingById(id: number) {
    const booking = await this.foundById({ id });

    return { item: booking };
  }

  async adminConfirmBooking(
    id: number,
    user: RequestUserDto,
    adminConfirmBookingDto: AdminConfirmBookingDto,
  ) {
    const booking = await this.foundById({ id });

    if (booking.status !== Status.pending) {
      throw new BadRequestException(MSG_ERROR_YOU_ONLY_EDIT_PENDING_BOOKING);
    }

    const updateBooking = await this.updateData({
      where: { id },
      data: { ...adminConfirmBookingDto, modifiedByAdminId: user.id },
      include: { createdByUser: { select: { email: true } } },
    });

    const sendMail = new sendMailEvent();
    sendMail.email = updateBooking.createdByUser.email;
    sendMail.subject = 'Booking request result';
    sendMail.template = './booking-request-result';
    sendMail.context = {
      approved: updateBooking.status === Status.approved ? true : false,
      rejected: updateBooking.status === Status.approved ? false : true,
      url: `${this.configService.get('CLIENT_HOST')}/booking-details/${
        updateBooking.id
      }`,
      rejectedReason: updateBooking.rejectedReason,
    };

    this.eventEmitter.emit(MailEventEnum.sendMailListener, sendMail);

    if (updateBooking.status === Status.approved) {
      const rejectBooking = new rejectBookingEvent();
      rejectBooking.booking = updateBooking;
      rejectBooking.adminId = user.id;

      this.eventEmitter.emit(BookingEventEnum.rejectListener, rejectBooking);
    }

    return {
      message: MSG_UPDATE_BOOKING_SUCCESSFULLY,
    };
  }

  async cancelBooking(id: number, user: RequestUserDto) {
    dayjs.extend(utc);
    const currentDateUTC = dayjs(new Date()).format();
    const booking = await this.foundById({ id });

    if (
      booking.status !== Status.pending &&
      booking.status !== Status.approved
    ) {
      throw new BadRequestException(
        MSG_ERROR_YOU_ONLY_CANCEL_PENDING_OR_APPROVED_BOOKING,
      );
    }

    if (booking.startTime < new Date(currentDateUTC)) {
      throw new BadRequestException(
        MSG_ERROR_YOU_ONLY_CANCEL_NOT_STARTED_BOOKING,
      );
    }

    if (booking.createdByUserId === user.id) {
      await this.updateData({
        where: { id: id },
        data: { status: Status.cancel },
      });
    }

    if (booking.createdByUserId !== user.id) {
      const rolePermissionBookingChangeStatus =
        await this.prisma.rolePermission.findFirst({
          where: {
            role: { id: user.roleId },
            permission: { code: PermissionsCodeEnum.BookingRequest },
            ability: { code: AbilitiesCodeEnum.Update },
          },
        });

      if (!rolePermissionBookingChangeStatus) {
        throw new BadRequestException(MSG_ERROR_YOU_ONLY_EDIT_YOUR_BOOKING);
      }

      const updateBooking = await this.updateData({
        where: { id: id },
        data: { status: Status.cancel, modifiedByAdminId: user.id },
        include: { createdByUser: { select: { email: true } } },
      });

      const sendMail = new sendMailEvent();
      sendMail.email = updateBooking.createdByUser.email;
      sendMail.subject = 'Booking request result';
      sendMail.template = './booking-request-result';
      sendMail.context = {
        cancel: true,
        url: `${this.configService.get('CLIENT_HOST')}/booking-details/${
          updateBooking.id
        }`,
      };

      this.eventEmitter.emit(MailEventEnum.sendMailListener, sendMail);
    }

    return {
      message: MSG_CANCEL_BOOKING_SUCCESSFULLY,
    };
  }

  async rejectBookingEndTimeLessNow() {
    dayjs.extend(utc);
    const currentDateUTC = dayjs(new Date()).format();
    const d = new Date(currentDateUTC);
    const dateNow = d.toISOString();

    const bookingPending = await this.foundByWhere({
      where: {
        status: Status.pending,
        endTime: { lte: dateNow },
      },
      include: { createdByUser: { select: { email: true } } },
    });

    if (bookingPending.length !== 0) {
      for (let i = 0; i < bookingPending.length; i++) {
        const bookingReject = await this.updateData({
          where: { id: bookingPending[i].id },
          data: {
            status: Status.reject,
            rejectedReason: MSG_ERROR_ROOM_BOOKED_TIME_HAS_EXPIRED,
          },
        });
        const sendMail = new sendMailEvent();
        sendMail.email = bookingPending[i].createdByUser.email;
        sendMail.subject = 'Booking request result';
        sendMail.template = './booking-request-result';
        sendMail.context = {
          rejected: true,
          url: `${this.configService.get('CLIENT_HOST')}/booking-details/${
            bookingReject.id
          }`,
          rejectedReason: bookingReject.rejectedReason,
        };

        this.eventEmitter.emit(MailEventEnum.sendMailListener, sendMail);
      }
    }
  }

  async deleteRejectOrCancelBookingOlderThanWeek() {
    dayjs.extend(utc);
    const currentDateUTC = dayjs(new Date()).format();
    const d = new Date(currentDateUTC);
    const beforeSevenDays = new Date(
      d.setDate(d.getDate() - RejectedBookingRequestDeletedLimit),
    );

    const bookingRejectOrCancel = await this.foundByWhere({
      where: {
        OR: [{ status: Status.reject }, { status: Status.cancel }],
        updatedAt: { lte: beforeSevenDays },
      },
    });

    if (bookingRejectOrCancel.length !== 0) {
      bookingRejectOrCancel.map(async (booking) => {
        await this.removeData({ where: { id: booking.id } });
      });
    }
  }

  async getCalendarBooking(calendarBookingDto: CalendarBookingDto) {
    const startDate = dayjs(new Date(calendarBookingDto.startDate))
      .set('hour', 0)
      .set('minute', 0)
      .set('second', 0)
      .set('millisecond', 0);
    const endDate = dayjs(new Date(calendarBookingDto.endDate))
      .set('hour', 23)
      .set('minute', 59)
      .set('second', 59)
      .set('millisecond', 99);

    const filter = calendarBookingDto.filter;

    let where: any = {
      startTime: { gte: startDate.format(), lt: endDate.format() },
    };

    if (filter) {
      where = {
        startTime: { gte: startDate.format(), lt: endDate.format() },
        ...filter,
      };
    }

    const items = await this.foundByWhere({
      where,
      include: {
        createdByUser: { select: { fullName: true } },
        room: { select: { name: true, capacity: true, color: true } },
      },
    });

    const data = {};

    for (let i = 0; i <= endDate.diff(startDate, 'day'); i++) {
      const day = dayjs(startDate).add(i, 'day').format('DD/MM/YYYY');
      data[day] = {
        bookedHours: 0,
        items: [],
      };
    }

    items.map((item) => {
      const day = dayjs(item.startTime).format('DD/MM/YYYY');
      data[day] = {
        bookedHours: +(
          data[day].bookedHours +
          (item.endTime.getTime() - item.startTime.getTime()) / OneHour
        ).toFixed(2),
        items: [...data[day].items, item],
      };
    });

    return { data };
  }

  async pendingBookingWhenRoomDisable(data: pendingBookingEvent) {
    const currentDateUTC = new Date(data.currentTime);

    const bookingApproved = await this.foundByWhere({
      where: {
        startTime: { gte: currentDateUTC },
        status: Status.approved,
        roomId: data.roomId,
      },
      include: { createdByUser: { select: { email: true } } },
    });

    const bookingApprovedId = bookingApproved.map((item) => item.id);

    if (bookingApproved.length !== 0) {
      await this.prisma.booking.updateMany({
        where: { id: { in: bookingApprovedId } },
        data: { status: Status.pending },
      });

      this.removeCache(BOOKING_CACHE);

      for (let i = 0; i < bookingApproved.length; i++) {
        const sendMail = new sendMailEvent();
        sendMail.email = bookingApproved[i].createdByUser.email;
        sendMail.subject = 'Booking request result';
        sendMail.template = './booking-request-result';
        sendMail.context = {
          pending: true,
          url: `${this.configService.get('CLIENT_HOST')}/booking-details/${
            bookingApproved[i].id
          }`,
          roomDisableReason: data.disableReason,
        };

        this.eventEmitter.emit(MailEventEnum.sendMailListener, sendMail);
      }
    }
  }
}
