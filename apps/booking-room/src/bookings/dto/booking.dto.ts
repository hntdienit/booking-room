import { ApiProperty } from '@nestjs/swagger';
import { Booking, Status } from '@prisma/client';

export class BookingDto implements Booking {
  @ApiProperty()
  id: number;

  @ApiProperty()
  startTime: Date;

  @ApiProperty()
  endTime: Date;

  @ApiProperty()
  reason: string;

  @ApiProperty()
  status: Status;

  @ApiProperty()
  rejectedReason: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  createdByUserId: number;

  @ApiProperty()
  modifiedByAdminId: number;

  @ApiProperty()
  roomId: number;
}
