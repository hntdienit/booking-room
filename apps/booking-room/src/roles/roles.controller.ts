import {
  Body,
  Controller,
  Delete,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Get,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { CreateRoleDto } from './dto/createRole.dto';
import { TransformDtoInterceptor } from '../share/TransformDtoInterceptor.share';
import { RoleDto } from './dto/role.dto';
import { FilterRoleDto } from './dto/filterRole.dto';
import { UpdateRoleDto } from './dto/updateRole.dto';
import { RolePermissionsGuard } from '../role-permissions/role-permission.guard';
import { RolePermissions } from '../role-permissions/role-permissions.decorator';
import { AppAbility } from '../casl/casl-ability.factory';
import { PermissionsCodeEnum } from '../permissions/permissions.enum';
import { AbilitiesCodeEnum } from '../abilities/abilities.enum';

@ApiTags('roles')
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @UseGuards(AuthGuard, RolePermissionsGuard)
  @RolePermissions((ability: AppAbility) =>
    ability.can(PermissionsCodeEnum.Role, AbilitiesCodeEnum.Create),
  )
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'message: Create role successfully' })
  async createRole(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.createRole(createRoleDto);
  }

  @Post('list')
  @UseInterceptors(new TransformDtoInterceptor(RoleDto))
  @UseGuards(AuthGuard, RolePermissionsGuard)
  @RolePermissions((ability: AppAbility) =>
    ability.can(PermissionsCodeEnum.Role, AbilitiesCodeEnum.Read),
  )
  @ApiBearerAuth()
  @ApiOkResponse({ type: RoleDto, isArray: true })
  async getListRole(@Body() filterRoleDto: FilterRoleDto) {
    return this.rolesService.getListRole(filterRoleDto);
  }

  @Get(':id')
  @UseInterceptors(new TransformDtoInterceptor(RoleDto))
  @UseGuards(AuthGuard, RolePermissionsGuard)
  @RolePermissions((ability: AppAbility) =>
    ability.can(PermissionsCodeEnum.Role, AbilitiesCodeEnum.Read),
  )
  @ApiBearerAuth()
  @ApiOkResponse()
  async getRoleById(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.getRoleById(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RolePermissionsGuard)
  @RolePermissions((ability: AppAbility) =>
    ability.can(PermissionsCodeEnum.Role, AbilitiesCodeEnum.Update),
  )
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'message: Update role successfully' })
  updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.rolesService.updateRole(id, updateRoleDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolePermissionsGuard)
  @RolePermissions((ability: AppAbility) =>
    ability.can(PermissionsCodeEnum.Role, AbilitiesCodeEnum.Delete),
  )
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'message: Delete role successfully' })
  removeRole(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.removeRole(id);
  }
}

