import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class RoleDto implements Role {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  isSystem: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
