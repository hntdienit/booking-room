import { ApiProperty } from '@nestjs/swagger';
import { Status } from '@prisma/client';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AdminConfirmBookingDto {
  @IsIn([Status.approved, Status.reject])
  @IsNotEmpty()
  @ApiProperty({ default: Status.approved })
  status: Status;

  @IsString()
  @IsOptional()
  @ApiProperty()
  rejectedReason: string;
}
