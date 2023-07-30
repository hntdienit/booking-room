import { PickType } from '@nestjs/swagger';

import { LoginUserDto } from './loginUser.dto';

export class ForgotPasswordUserDto extends PickType(LoginUserDto, [
  'email',
] as const) {}
