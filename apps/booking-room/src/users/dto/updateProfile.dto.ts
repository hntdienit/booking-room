import { OmitType, PartialType } from '@nestjs/swagger';

import { CreateUserDto } from './createUser.dto';

export class UpdateProfileDto extends PartialType(
  OmitType(CreateUserDto, ['email', 'roleId']),
) {}
