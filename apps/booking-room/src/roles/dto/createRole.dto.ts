import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateRoleDto {
  @MaxLength(20, {
    message:
      'Name is too long. Maximum length is $constraint1 characters, but actual is $value',
  })
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  name: string;
}
