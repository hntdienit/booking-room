import { OmitType, PartialType } from '@nestjs/swagger';
import { FilterDto } from '../../share/dto/filter.dto';

export class FilterPublicUserDto extends PartialType(
  OmitType(FilterDto, ['select', 'include'] as const),
) {}
