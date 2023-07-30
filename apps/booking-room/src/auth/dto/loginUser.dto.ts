import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class LoginUserDto {
  @IsEmail()
  @MaxLength(100, {
    message:
      'Email is too long. Maximum length is $constraint1 characters, but actual is $value',
  })
  @IsNotEmpty()
  @ApiProperty()
  email: string;

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
  password: string;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ required: false, default: false })
  isRemember?: boolean = false;
}
