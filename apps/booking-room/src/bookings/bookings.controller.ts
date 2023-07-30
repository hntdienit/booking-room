import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { User } from '../users/user.decorator';
import { RequestUserDto } from '../users/dto/requestUser.dto';
import { CreateBookingDto } from './dto/createBooking.dto';
import { AuthGuard } from '../auth/auth.guard';
import { BookingDto } from './dto/booking.dto';
import { FilterBookingDto } from './dto/filterBooking.dto';
import { UserUpdateBookingDto } from './dto/userUpdateBooking.dto';
import { AdminConfirmBookingDto } from './dto/adminConfirmBooking.dto';
import { CalendarBookingDto } from './dto/calendarBooking.dto';
import { TransformDtoInterceptor } from '../share/TransformDtoInterceptor.share';
import { RolePermissionsGuard } from '../role-permissions/role-permission.guard';
import { RolePermissions } from '../role-permissions/role-permissions.decorator';
import { AppAbility } from '../casl/casl-ability.factory';
import { PermissionsCodeEnum } from '../permissions/permissions.enum';
import { AbilitiesCodeEnum } from '../abilities/abilities.enum';

@ApiTags('bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @UseGuards(AuthGuard, RolePermissionsGuard)
  @RolePermissions((ability: AppAbility) =>
    ability.can(PermissionsCodeEnum.BookingRoom, AbilitiesCodeEnum.Create),
  )
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'message: Create booking successfully' })
  async createBooking(
    @User() user: RequestUserDto,
    @Body() createBookingDto: CreateBookingDto,
  ) {
    return this.bookingsService.createBooking(user, createBookingDto);
  }

  @Post('list')
  @UseInterceptors(new TransformDtoInterceptor(BookingDto))
  @UseGuards(AuthGuard, RolePermissionsGuard)
  @RolePermissions((ability: AppAbility) =>
    ability.can(PermissionsCodeEnum.BookingRoom, AbilitiesCodeEnum.Read),
  )
  @ApiBearerAuth()
  @ApiOkResponse({ type: BookingDto, isArray: true })
  async getListBooking(@Body() filterBookingDto: FilterBookingDto) {
    return this.bookingsService.getListBooking(filterBookingDto);
  }

  @Post('calendar')
  @UseGuards(AuthGuard, RolePermissionsGuard)
  @RolePermissions((ability: AppAbility) =>
    ability.can(PermissionsCodeEnum.BookingRoom, AbilitiesCodeEnum.Read),
  )
  @ApiBearerAuth()
  @ApiOkResponse({ type: BookingDto, isArray: true })
  async getCalendarBooking(@Body() calendarBookingDto: CalendarBookingDto) {
    return this.bookingsService.getCalendarBooking(calendarBookingDto);
  }

  @Get(':id')
  @UseInterceptors(new TransformDtoInterceptor(BookingDto))
  @UseGuards(AuthGuard, RolePermissionsGuard)
  @RolePermissions((ability: AppAbility) =>
    ability.can(PermissionsCodeEnum.BookingRoom, AbilitiesCodeEnum.Read),
  )
  @ApiBearerAuth()
  @ApiOkResponse({ type: BookingDto })
  async getBookingById(@Param('id', ParseIntPipe) id: number) {
    return this.bookingsService.getBookingById(id);
  }

  @Patch(':id/status')
  @UseGuards(AuthGuard, RolePermissionsGuard)
  @RolePermissions((ability: AppAbility) =>
    ability.can(PermissionsCodeEnum.BookingRequest, AbilitiesCodeEnum.Update),
  )
  @ApiBearerAuth()
  @ApiOkResponse({
    type: BookingDto,
    description: 'message: Update booking successfully',
  })
  async adminConfirmBooking(
    @Param('id', ParseIntPipe) id: number,
    @User() user: RequestUserDto,
    @Body() adminConfirmBookingDto: AdminConfirmBookingDto,
  ) {
    return await this.bookingsService.adminConfirmBooking(
      id,
      user,
      adminConfirmBookingDto,
    );
  }

  @Patch(':id/cancel')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'message: Cancel booking successfully',
  })
  async cancelBooking(
    @Param('id', ParseIntPipe) id: number,
    @User() user: RequestUserDto,
  ) {
    return await this.bookingsService.cancelBooking(id, user);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RolePermissionsGuard)
  @RolePermissions((ability: AppAbility) =>
    ability.can(PermissionsCodeEnum.BookingRoom, AbilitiesCodeEnum.Update),
  )
  @ApiBearerAuth()
  @ApiOkResponse({
    type: BookingDto,
    description: 'message: Update booking successfully',
  })
  userUpdateBooking(
    @Param('id', ParseIntPipe) id: number,
    @User() user: RequestUserDto,
    @Body() userUpdateBookingDto: UserUpdateBookingDto,
  ) {
    return this.bookingsService.userUpdateBooking(
      id,
      user,
      userUpdateBookingDto,
    );
  }
}
