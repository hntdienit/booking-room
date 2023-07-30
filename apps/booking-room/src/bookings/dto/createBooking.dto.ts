import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsString,
  MinDate,
  Validate,
} from 'class-validator';
import utc from 'dayjs/plugin/utc';
import dayjs from 'dayjs';
import { GreaterThan } from '../../helpers/dateCompare.helper';

export class CreateBookingDto {
  @MinDate(
    () => {
      dayjs.extend(utc);
      const currentDateUTC = dayjs(new Date()).format();
      return new Date(currentDateUTC);
    },
    {
      message: 'StartDate must be greater than current time',
    },
  )
  @IsDate()
  @Transform(({ value }) => value && new Date(value))
  @IsNotEmpty()
  @ApiProperty()
  startTime: Date;

  @Validate(GreaterThan, ['startTime'])
  @IsDate()
  @Transform(({ value }) => value && new Date(value))
  @IsNotEmpty()
  @ApiProperty()
  endTime: Date;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  reason: string;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty()
  roomId: number;
}
