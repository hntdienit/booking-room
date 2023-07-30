import {
  AbilityBuilder,
  MongoAbility,
  createMongoAbility,
} from '@casl/ability';
import { Inject, Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ArrayPermissionAbilityCasl } from '../helpers/arrayHandle.helper';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { getCacheKey } from '../helpers/cache.helper';
import { PERMISSIONABILITYCASL_CACHE } from '../constants/cache.constant';

export type AppAbility = MongoAbility;

@Injectable()
export class CaslAbilityFactory {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) protected readonly cacheManager: Cache,
  ) {}

  async createForUser(user: User) {
    const { can, build } = new AbilityBuilder(createMongoAbility);

    let permissionsUser;

    const cacheKey = getCacheKey({
      cacheName: PERMISSIONABILITYCASL_CACHE,
      name: user,
    });
    const cacheItem = await this.cacheManager.get(cacheKey);

    if (cacheItem) {
      permissionsUser = cacheItem;
    }

    if (!cacheItem) {
      const [rolePermissionsUser, userPermissionsUser] = await Promise.all([
        await this.prisma.rolePermission.findMany({
          where: { roleId: user.roleId },
          include: { permission: true, ability: true },
        }),
        await this.prisma.userPermission.findMany({
          where: { userId: user.id },
          include: { permission: true, ability: true },
        }),
      ]);

      permissionsUser = ArrayPermissionAbilityCasl({
        rolePermission: rolePermissionsUser,
        userPermission: userPermissionsUser,
      });

      await this.cacheManager.set(cacheKey, permissionsUser);
    }

    for (let i = 0; i < permissionsUser.length; i++) {
      can(permissionsUser[i].permission.code, permissionsUser[i].ability.code);
    }

    return build({
      detectSubjectType: (item) => item.__typename,
    });
  }
}
