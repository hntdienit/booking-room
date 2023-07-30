import { ApiProperty } from '@nestjs/swagger';
import { Room } from '@prisma/client';

export class RoomDto implements Room {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  color: string;

  @ApiProperty()
  capacity: number;

  @ApiProperty()
  isEnable: boolean;

  @ApiProperty()
  disableReason: string;
}
