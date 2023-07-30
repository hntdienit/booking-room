import { PartialType } from '@nestjs/swagger';
import { CreateBookingDto } from './createBooking.dto';

export class UserUpdateBookingDto extends PartialType(CreateBookingDto) {}

