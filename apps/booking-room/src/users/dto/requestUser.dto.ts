import { PickType } from '@nestjs/swagger';
import { UserDto } from './user.dto';

export class RequestUserDto extends PickType(UserDto, [
  'id',
  'email',
  'roleId',
] as const) {}
