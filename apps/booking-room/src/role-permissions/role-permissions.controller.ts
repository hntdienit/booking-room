import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { RolePermissionService } from './role-permissions.service';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UpdateRolePermissionDto } from './dto/updateRolePermission.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolePermissionsGuard } from './role-permission.guard';
import { RolePermissions } from './role-permissions.decorator';
import { AppAbility } from '../casl/casl-ability.factory';
import { PermissionsCodeEnum } from '../permissions/permissions.enum';
import { AbilitiesCodeEnum } from '../abilities/abilities.enum';

@ApiTags('role-permissions')
@Controller('role-permissions')
export class RolePermissionController {
  constructor(private readonly rolePermissionService: RolePermissionService) {}

  @Patch(':id')
  @UseGuards(AuthGuard, RolePermissionsGuard)
  @RolePermissions((ability: AppAbility) =>
    ability.can(PermissionsCodeEnum.Role, AbilitiesCodeEnum.Update),
  )
  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'message: Update permission for role successfully',
  })
  updateRolePermission(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRolePermissionDto: UpdateRolePermissionDto,
  ) {
    return this.rolePermissionService.updateRolePermission(
      id,
      updateRolePermissionDto,
    );
  }
}
