import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateRoomDto {
  @Matches(/^[A-Za-z0-9 ]+$/, {
    message: 'Name not use special character',
  })
  @MaxLength(20, {
    message:
      'Name is too long. Maximum length is $constraint1 characters, but actual is $value',
  })
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  name: string;

  @Max(20, { message: 'Capacity is not larger than $constraint1' })
  @Min(1, { message: 'Capacity is not smaller than $constraint1' })
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty()
  capacity: number;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  color: string;

  @IsBoolean()
  @IsNotEmpty()
  @ApiProperty({ default: true })
  isEnable: boolean;

  @IsString()
  @IsOptional()
  @ApiProperty()
  disableReason: string;
}
