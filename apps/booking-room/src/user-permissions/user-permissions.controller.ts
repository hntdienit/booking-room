import { Body, Controller, Param, ParseIntPipe, Patch, UseGuards } from '@nestjs/common';
import { UserPermissionsService } from './user-permissions.service';
import { PermissionsCodeEnum } from '../permissions/permissions.enum';
import { AbilitiesCodeEnum } from '../abilities/abilities.enum';
import { AppAbility } from '../casl/casl-ability.factory';
import { RolePermissionsGuard } from '../role-permissions/role-permission.guard';
import { AuthGuard } from '../auth/auth.guard';
import { RolePermissions } from '../role-permissions/role-permissions.decorator';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UpdateUserPermissionDto } from './dto/updateUserPermission.dto';

@ApiTags('user-permissions')
@Controller('user-permissions')
export class UserPermissionsController {
  constructor(
    private readonly userPermissionsService: UserPermissionsService,
  ) {}

  @Patch(':id')
  @UseGuards(AuthGuard, RolePermissionsGuard)
  @RolePermissions((ability: AppAbility) =>
    ability.can(PermissionsCodeEnum.Role, AbilitiesCodeEnum.Update),
  )
  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'message: Update permission for user successfully',
  })
  updateUserPermission(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserPermissionDto: UpdateUserPermissionDto,
  ) {
    return this.userPermissionsService.updateUserPermission(
      id,
      updateUserPermissionDto,
    );
  }
}
