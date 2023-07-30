import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CrudService } from '../crud/crud.service';
import { PrismaService } from '../prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import {
  PERMISSIONABILITYCASL_CACHE,
  ROLE_CACHE,
  USERPERMISSION_CACHE,
  USER_CACHE,
} from '../constants/cache.constant';
import { UpdateUserPermissionDto } from './dto/updateUserPermission.dto';
import {
  MSG_UPDATE_PERMISSION_FOR_USER_FAILED,
  MSG_UPDATE_PERMISSION_FOR_USER_SUCCESSFULLY,
} from '../constants/message.constant';
import { RolePermissionService } from '../role-permissions/role-permissions.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class UserPermissionsService extends CrudService {
  constructor(
    protected readonly prisma: PrismaService,
    private readonly rolePermissionService: RolePermissionService,
    private readonly usersService: UsersService,
    @Inject(CACHE_MANAGER) protected readonly cacheManager: Cache,
  ) {
    super(prisma, cacheManager, USERPERMISSION_CACHE);
  }

  async updateUserPermission(
    id: number,
    updateUserPermissionDto: UpdateUserPermissionDto,
  ) {
    const userPermission = [...updateUserPermissionDto.permissions];
    const user = await this.usersService.foundById({ id });
    const rolePermission = await this.rolePermissionService.foundByWhere({
      where: { roleId: user.roleId },
    });

    await this.rolePermissionService.checkPermissionOverlap({
      data: userPermission,
    });

    await this.rolePermissionService.checkPermissionHaveAbility({
      data: userPermission,
    });

    const userPermissionStringify = [];
    const userPermissions = [];

    for (let i = 0; i < userPermission.length; i++) {
      if (
        !userPermissionStringify.includes(JSON.stringify(userPermission[i]))
      ) {
        userPermissionStringify.push(JSON.stringify(userPermission[i]));
      }

      const findRolePermission = rolePermission.filter((item) => {
        return (
          item.permissionId === userPermission[i].permissionId &&
          item.abilityId === userPermission[i].abilityId
        );
      });

      if (findRolePermission.length === 0) {
        userPermissions.push({
          isEnable: true,
          userId: user.id,
          ...userPermission[i],
        });
      }
    }

    for (let i = 0; i < rolePermission.length; i++) {
      if (
        !userPermissionStringify.includes(
          JSON.stringify({
            permissionId: rolePermission[i].permissionId,
            abilityId: rolePermission[i].abilityId,
          }),
        )
      ) {
        userPermissions.push({
          isEnable: false,
          userId: user.id,
          permissionId: rolePermission[i].permissionId,
          abilityId: rolePermission[i].abilityId,
        });
      }
    }

    const userPermissionOld = await this.foundByWhere({
      where: { userId: user.id },
    });

    const userPermissionOldId = [];

    for (let i = 0; i < userPermissionOld.length; i++) {
      userPermissionOldId.push(userPermissionOld[i].id);
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.userPermission.deleteMany({
          where: { id: { in: userPermissionOldId } },
        });

        await tx.userPermission.createMany({
          data: userPermissions,
        });
      });

      this.removeCache(ROLE_CACHE);
      this.removeCache(USER_CACHE);
      this.removeCache(PERMISSIONABILITYCASL_CACHE);
    } catch (err) {
      throw new BadRequestException(MSG_UPDATE_PERMISSION_FOR_USER_FAILED);
    }

    return {
      message: MSG_UPDATE_PERMISSION_FOR_USER_SUCCESSFULLY,
    };
  }
}
