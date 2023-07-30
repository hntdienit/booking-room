import { PartialType } from '@nestjs/swagger';
import { FilterDto } from '../../share/dto/filter.dto';

export class FilterCrudDto extends PartialType(FilterDto) {}
