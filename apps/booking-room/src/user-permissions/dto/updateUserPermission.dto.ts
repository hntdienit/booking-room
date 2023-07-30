import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class UpdateUserPermissionDto {
  @IsNotEmpty()
  @ApiProperty()
  permissions: any;
}
