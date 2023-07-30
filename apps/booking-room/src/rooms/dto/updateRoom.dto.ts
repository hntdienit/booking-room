import { CreateRoomDto } from './createRoom.dto';
import { PartialType } from '@nestjs/swagger';

export class UpdateRoomDto extends PartialType(CreateRoomDto) {}

