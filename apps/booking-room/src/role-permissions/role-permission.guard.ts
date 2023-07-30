import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppAbility, CaslAbilityFactory } from '../casl/casl-ability.factory';
import { RolePermissionHandler } from './role-permissions.decorator';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RolePermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private caslAbilityFactory: CaslAbilityFactory,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const rolePermissionHandlers =
      this.reflector.get<RolePermissionHandler[]>(
        this.configService.get('CHECK_ROLEPERMISSION_KEY'),
        context.getHandler(),
      ) || [];

    const { user } = context.switchToHttp().getRequest();
    const ability = await this.caslAbilityFactory.createForUser(user);

    return rolePermissionHandlers.every((handler) =>
      this.execRolePermissionHandler(handler, ability),
    );
  }

  private execRolePermissionHandler(
    handler: RolePermissionHandler,
    ability: AppAbility,
  ) {
    if (typeof handler === 'function') {
      return handler(ability);
    }
    return handler.handle(ability);
  }
}
