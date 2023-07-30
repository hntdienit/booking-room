import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
  IsJWT,
} from 'class-validator';
export class ResetPasswordUserDto {
  @Matches(/^(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]/, {
    message: 'Password at least 1 number and 1 uppercase character',
  })
  @MinLength(8, {
    message:
      'Password is too short. Minimal length is $constraint1 characters, but actual is $value',
  })
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  newPassword: string;
  @IsJWT({ message: 'String is not jwt' })
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  jwt: string;
}
