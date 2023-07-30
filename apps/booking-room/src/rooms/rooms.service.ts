import {
  BadRequestException,
  Inject,
  Injectable,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoomDto } from './dto/createRoom.dto';
import {
  MSG_CREATE_ROOM_SUCCESSFULLY,
  MSG_DELETE_ROOM_SUCCESSFULLY,
  MSG_ERROR_CANNOT_DELETE_ROOM,
  MSG_ERROR_ROOM_COLOR_WAS_ALREADY_IN_USE,
  MSG_ERROR_ROOM_NAME_WAS_ALREADY_IN_USE,
  MSG_ERROR_YOU_MUST_REASON_DISABLE_ROOM,
  MSG_UPDATE_ROOM_SUCCESSFULLY,
} from '../constants/message.constant';
import { FilterRoomDto } from './dto/filterRoom.dto';
import { UpdateRoomDto } from './dto/updateRoom.dto';
import { BookingsService } from '../bookings/bookings.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ROOM_CACHE } from '../constants/cache.constant';
import { CrudService } from '../crud/crud.service';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { pendingBookingEvent } from '../bookings/events/bookings.event';
import { BookingEventEnum } from '../bookings/bookingEvent.enum';

@Injectable()
export class RoomsService extends CrudService {
  constructor(
    protected readonly prisma: PrismaService,
    @Inject(forwardRef(() => BookingsService))
    private readonly bookingsService: BookingsService,
    private readonly eventEmitter: EventEmitter2,
    @Inject(CACHE_MANAGER) protected readonly cacheManager: Cache,
  ) {
    super(prisma, cacheManager, ROOM_CACHE);
  }

  async createRoom(createRoomDto: CreateRoomDto) {
    const isNameRoomExist = await this.foundByWhere({
      where: { name: createRoomDto.name },
    });

    if (isNameRoomExist.length !== 0) {
      throw new BadRequestException(MSG_ERROR_ROOM_NAME_WAS_ALREADY_IN_USE);
    }

    const isColorExist = await this.foundByWhere({
      where: { color: createRoomDto.color },
    });

    if (isColorExist.length !== 0) {
      throw new BadRequestException(MSG_ERROR_ROOM_COLOR_WAS_ALREADY_IN_USE);
    }

    if (createRoomDto.isEnable === false) {
      if (!createRoomDto.disableReason) {
        throw new BadRequestException(MSG_ERROR_YOU_MUST_REASON_DISABLE_ROOM);
      }
    }

    await this.createData({ data: createRoomDto });

    return {
      message: MSG_CREATE_ROOM_SUCCESSFULLY,
    };
  }

  async getListRoom(filterRoomDto: FilterRoomDto) {
    const lists = await this.getList({ filterCrudDto: filterRoomDto });

    return lists;
  }

  async getRoomById(id: number) {
    const room = await this.foundById({ id });

    return { item: room };
  }

  async updateRoom(id: number, updateRoomDto: UpdateRoomDto) {
    await this.foundById({ id });

    if (updateRoomDto.name) {
      const isNameRoomExist = await this.foundByWhere({
        where: {
          id: { not: id },
          name: updateRoomDto.name,
        },
      });

      if (isNameRoomExist.length !== 0) {
        throw new BadRequestException(MSG_ERROR_ROOM_NAME_WAS_ALREADY_IN_USE);
      }
    }

    if (updateRoomDto.color) {
      const isColorExist = await this.foundByWhere({
        where: {
          id: { not: id },
          color: updateRoomDto.color,
        },
      });

      if (isColorExist.length !== 0) {
        throw new BadRequestException(MSG_ERROR_ROOM_COLOR_WAS_ALREADY_IN_USE);
      }
    }

    if (updateRoomDto.isEnable === false) {
      if (!updateRoomDto.disableReason) {
        throw new BadRequestException(MSG_ERROR_YOU_MUST_REASON_DISABLE_ROOM);
      }
    }

    const updateRoom = await this.updateData({
      where: { id },
      data: updateRoomDto.isEnable
        ? { ...updateRoomDto, disableReason: null }
        : updateRoomDto,
    });

    if (updateRoomDto.isEnable === false) {
      dayjs.extend(utc);
      const currentDateUTC = dayjs(new Date()).format();

      const pendingBooking = new pendingBookingEvent();
      pendingBooking.currentTime = currentDateUTC;
      pendingBooking.roomId = updateRoom.id;
      pendingBooking.disableReason = updateRoom.disableReason;

      this.eventEmitter.emit(BookingEventEnum.pendingListener, pendingBooking);
    }

    return {
      message: MSG_UPDATE_ROOM_SUCCESSFULLY,
    };
  }

  async removeRoom(id: number) {
    await this.foundById({ id });

    const roomBooking = await this.bookingsService.foundByWhere({
      where: { roomId: id },
    });

    if (roomBooking.length !== 0) {
      throw new BadRequestException(MSG_ERROR_CANNOT_DELETE_ROOM);
    }

    await this.removeData({ where: { id } });

    return { message: MSG_DELETE_ROOM_SUCCESSFULLY };
  }
}
