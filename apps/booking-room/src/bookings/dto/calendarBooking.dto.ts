import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDate, IsNotEmpty, IsOptional, Validate } from 'class-validator';
import { GreaterThanOrEqual } from '../../helpers/dateCompare.helper';

export class CalendarBookingDto {
  @IsDate()
  @Transform(({ value }) => value && new Date(value))
  @IsNotEmpty()
  @ApiProperty()
  startDate: Date;

  @Validate(GreaterThanOrEqual, ['startDate'])
  @IsDate()
  @Transform(({ value }) => value && new Date(value))
  @IsNotEmpty()
  @ApiProperty()
  endDate: Date;

  @IsOptional()
  @ApiProperty()
  filter: any;
}
