import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class FilterDto {
  @IsNumber()
  @IsOptional()
  @ApiProperty()
  page: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty()
  size: number;

  @IsOptional()
  @ApiProperty()
  where: any = {};

  @IsOptional()
  @ApiProperty()
  select: any = null;

  @IsOptional()
  @ApiProperty()
  orderBy: any = {};

  @IsOptional()
  @ApiProperty()
  include: any = null;
}
