import { SetMetadata } from '@nestjs/common';
import { AppAbility } from '../casl/casl-ability.factory';

interface IRolePermissionHandler {
  handle(ability: AppAbility): boolean;
}

export const RolePermissions = (...handlers: RolePermissionHandler[]) =>
  SetMetadata(process.env.CHECK_ROLEPERMISSION_KEY, handlers);

type RolePermissionCallback = (ability: AppAbility) => boolean;

export type RolePermissionHandler = IRolePermissionHandler | RolePermissionCallback;
