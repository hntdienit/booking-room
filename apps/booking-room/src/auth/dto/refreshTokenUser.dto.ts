import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsJWT } from 'class-validator';
export class RefreshTokenUserDto {
  @IsJWT({ message: 'String is not jwt' })
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  refreshToken: string;
}
