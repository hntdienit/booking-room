import { ApiProperty } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { Exclude } from 'class-transformer';

export class UserDto implements User {
  @ApiProperty()
  id: number;

  @ApiProperty()
  email: string;

  @Exclude()
  @ApiProperty()
  password: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  avatarUrl: string;

  @ApiProperty()
  isActive: boolean;

  @Exclude()
  @ApiProperty()
  resetPasswordHash: string;

  @Exclude()
  @ApiProperty()
  refreshToken: string;

  @ApiProperty()
  roleId: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
