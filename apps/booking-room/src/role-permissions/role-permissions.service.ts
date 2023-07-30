import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CrudService } from '../crud/crud.service';
import { PrismaService } from '../prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import {
  PERMISSIONABILITYCASL_CACHE,
  ROLEPERMISSION_CACHE,
  ROLE_CACHE,
  USER_CACHE,
} from '../constants/cache.constant';
import { UpdateRolePermissionDto } from './dto/updateRolePermission.dto';
import {
  MSG_ERROR_OVERLAP_PERMISSION,
  MSG_ERROR_PERMISSION_HAS_NOT_ABILITY,
  MSG_UPDATE_PERMISSION_FOR_ROLE_FAILED,
  MSG_UPDATE_PERMISSION_FOR_ROLE_SUCCESSFULLY,
} from '../constants/message.constant';
import { RolesService } from '../roles/roles.service';
import { PermissionsService } from '../permissions/permissions.service';
import { AbilitiesService } from '../abilities/abilities.service';

@Injectable()
export class RolePermissionService extends CrudService {
  constructor(
    protected readonly prisma: PrismaService,
    protected readonly permissionsService: PermissionsService,
    protected readonly abilitiesService: AbilitiesService,
    private readonly rolesService: RolesService,
    @Inject(CACHE_MANAGER) protected readonly cacheManager: Cache,
  ) {
    super(prisma, cacheManager, ROLEPERMISSION_CACHE);
  }

  async checkPermissionOverlap(args: { data: any }) {
    const uniquePermission = [];

    for (let i = 0; i < args.data.length; i++) {
      if (uniquePermission.includes(JSON.stringify(args.data[i]))) {
        throw new BadRequestException(MSG_ERROR_OVERLAP_PERMISSION);
      }
      uniquePermission.push(JSON.stringify(args.data[i]));
    }
  }

  async checkPermissionHaveAbility(args: { data: any }) {
    const permissionsId = [];
    const abilitiesId = [];

    for (let i = 0; i < args.data.length; i++) {
      if (!permissionsId.includes(args.data[i].permissionId)) {
        permissionsId.push(args.data[i].permissionId);
      }

      if (!abilitiesId.includes(args.data[i].abilityId)) {
        abilitiesId.push(args.data[i].abilityId);
      }
    }

    const [permissions, abilities] = await Promise.all([
      await this.permissionsService.foundByWhere({
        where: { id: { in: permissionsId } },
      }),
      await this.abilitiesService.foundByWhere({
        where: { id: { in: abilitiesId } },
      }),
    ]);

    for (let i = 0; i < args.data.length; i++) {
      const permission = permissions.find((item) => {
        return item.id === args.data[i].permissionId;
      });

      const ability = abilities.find((item) => {
        return item.id === args.data[i].abilityId;
      });

      if (permission.disableAbility.includes(ability.code)) {
        throw new BadRequestException(MSG_ERROR_PERMISSION_HAS_NOT_ABILITY);
      }
    }
  }

  async updateRolePermission(
    id: number,
    updateRolePermissionDto: UpdateRolePermissionDto,
  ) {
    await this.rolesService.foundById({ id });

    const requestBody = [...updateRolePermissionDto.permissions];

    await this.checkPermissionOverlap({
      data: requestBody,
    });

    await this.checkPermissionHaveAbility({
      data: requestBody,
    });

    const rolePermissionIdOld = await this.foundByWhere({
      where: { roleId: id },
    });

    try {
      await this.prisma.$transaction(async (tx) => {
        await Promise.all(
          rolePermissionIdOld.map(async (item) => {
            await tx.rolePermission.delete({
              where: { id: item.id },
            });
          }),
        );

        await Promise.all(
          requestBody.map(async (item) => {
            await tx.rolePermission.create({
              data: {
                roleId: id,
                permissionId: item.permissionId,
                abilityId: item.abilityId,
              },
            });
          }),
        );
      });

      this.removeCache(ROLE_CACHE);
      this.removeCache(USER_CACHE);
      this.removeCache(PERMISSIONABILITYCASL_CACHE);
    } catch (err) {
      throw new BadRequestException(MSG_UPDATE_PERMISSION_FOR_ROLE_FAILED);
    }

    return {
      message: MSG_UPDATE_PERMISSION_FOR_ROLE_SUCCESSFULLY,
    };
  }
}
