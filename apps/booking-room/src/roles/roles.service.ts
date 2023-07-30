import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CrudService } from '../crud/crud.service';
import { PrismaService } from '../prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ROLE_CACHE } from '../constants/cache.constant';
import { CreateRoleDto } from './dto/createRole.dto';
import {
  MSG_CREATE_ROLE_SUCCESSFULLY,
  MSG_DELETE_ROLE_FAILED,
  MSG_DELETE_ROLE_SUCCESSFULLY,
  MSG_ERROR_CANNOT_DELETE_ROLE,
  MSG_ERROR_CAN_NOT_UPDATE_OR_DELETE_ROLE_SYSTEM,
  MSG_ERROR_ROLE_NAME_WAS_ALREADY_IN_USE,
  MSG_UPDATE_ROLE_SUCCESSFULLY,
} from '../constants/message.constant';
import { FilterRoleDto } from './dto/filterRole.dto';
import { UpdateRoleDto } from './dto/updateRole.dto';
import { UsersService } from '../users/users.service';
import { PermissionsService } from '../permissions/permissions.service';
import { AbilitiesService } from '../abilities/abilities.service';

@Injectable()
export class RolesService extends CrudService {
  constructor(
    protected readonly prisma: PrismaService,
    protected readonly permissionsService: PermissionsService,
    protected readonly abilitiesService: AbilitiesService,
    private readonly usersService: UsersService,
    @Inject(CACHE_MANAGER) protected readonly cacheManager: Cache,
  ) {
    super(prisma, cacheManager, ROLE_CACHE);
  }

  async createRole(createRoleDto: CreateRoleDto) {
    const isNameRoleExist = await this.foundByWhere({
      where: { name: createRoleDto.name },
    });

    if (isNameRoleExist.length !== 0) {
      throw new BadRequestException(MSG_ERROR_ROLE_NAME_WAS_ALREADY_IN_USE);
    }

    await this.createData({
      data: {
        name: createRoleDto.name,
        isSystem: false,
      },
    });

    return { message: MSG_CREATE_ROLE_SUCCESSFULLY };
  }

  async getListRole(filterRoleDto: FilterRoleDto) {
    const [lists, permissions, abilities]: any = await Promise.all([
      await this.getList({ filterCrudDto: filterRoleDto }),
      await this.permissionsService.foundByWhere({ where: {} }),
      await this.abilitiesService.foundByWhere({ where: {} }),
    ]);

    lists.permissions = permissions;
    lists.abilities = abilities;

    return lists;
  }

  async updateRole(id: number, updateRoleDto: UpdateRoleDto) {
    const findRole = await this.foundById({ id });

    if (findRole.isSystem) {
      throw new BadRequestException(
        MSG_ERROR_CAN_NOT_UPDATE_OR_DELETE_ROLE_SYSTEM,
      );
    }

    if (updateRoleDto.name) {
      const isNameRoleExist = await this.foundByWhere({
        where: {
          id: { not: id },
          name: updateRoleDto.name,
        },
      });

      if (isNameRoleExist.length !== 0) {
        throw new BadRequestException(MSG_ERROR_ROLE_NAME_WAS_ALREADY_IN_USE);
      }
    }

    await this.updateData({
      where: { id },
      data: updateRoleDto,
    });

    return { message: MSG_UPDATE_ROLE_SUCCESSFULLY };
  }

  async removeRole(id: number) {
    const findRole = await this.foundById({ id });

    if (findRole.isSystem) {
      throw new BadRequestException(
        MSG_ERROR_CAN_NOT_UPDATE_OR_DELETE_ROLE_SYSTEM,
      );
    }

    const userRole = await this.usersService.foundByWhere({
      where: { roleId: id },
    });

    if (userRole.length !== 0) {
      throw new BadRequestException(MSG_ERROR_CANNOT_DELETE_ROLE);
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.rolePermission.deleteMany({
          where: { roleId: id },
        });

        await tx.role.delete({ where: { id } });
      });

      this.removeCache(ROLE_CACHE);
    } catch (err) {
      throw new BadRequestException(MSG_DELETE_ROLE_FAILED);
    }

    return { message: MSG_DELETE_ROLE_SUCCESSFULLY };
  }

  async getRoleById(id: number) {
    const role = await this.foundById({
      id,
      include: { rolePermission: true },
    });

    return { item: role };
  }
}
