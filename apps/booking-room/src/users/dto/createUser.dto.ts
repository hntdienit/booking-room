import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsNumberString,
  IsString,
  MaxLength,
  MinLength,
  IsNumber,
} from 'class-validator';

export class CreateUserDto {
  @MaxLength(200, {
    message:
      'fullName is too long. Maximum length is $constraint1 characters, but actual is $value',
  })
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  fullName: string;

  @MaxLength(12, {
    message:
      'Phone is too long. Maximum length is $constraint1 characters, but actual is $value',
  })
  @MinLength(10, {
    message:
      'Phone is too short. Minimum length is $constraint1 characters, but actual is $value',
  })
  @IsNumberString()
  @IsOptional()
  @ApiProperty()
  phone: string;

  @IsEmail()
  @MaxLength(100, {
    message:
      'Email is too long. Maximum length is $constraint1 characters, but actual is $value',
  })
  @IsNotEmpty()
  @ApiProperty()
  email: string;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty()
  roleId: number;
}
