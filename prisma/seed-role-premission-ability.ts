import { PrismaClient } from '@prisma/client';
import { snakeCase } from 'change-case';

const prisma = new PrismaClient();

async function main() {
  enum roleEnum {
    Admin = 'Admin',
    Staff = 'Staff',
  }

  enum userEmailEnum {
    admin = 'dien.huynh@mail.com.au',
    staff = 'chau.nguyen@mail.com.au',
  }

  enum permissionEnum {
    role = 'Role',
    user = 'User',
    room = 'Room',
    booking = 'Booking Room',
    bookingRequest = 'Booking Request',
  }

  enum abilityEnum {
    create = 'Create',
    read = 'Read',
    update = 'Update',
    delete = 'Delete',
  }

  const role = [{ name: roleEnum.Staff }, { name: roleEnum.Admin }];

  const permission = [
    { name: permissionEnum.role, code: snakeCase(permissionEnum.role) },
    { name: permissionEnum.user, code: snakeCase(permissionEnum.user) },
    { name: permissionEnum.room, code: snakeCase(permissionEnum.room) },
    { name: permissionEnum.booking, code: snakeCase(permissionEnum.booking) },
    {
      name: permissionEnum.bookingRequest,
      code: snakeCase(permissionEnum.bookingRequest),
    },
  ];

  const ability = [
    { name: abilityEnum.create, code: snakeCase(abilityEnum.create) },
    { name: abilityEnum.read, code: snakeCase(abilityEnum.read) },
    { name: abilityEnum.update, code: snakeCase(abilityEnum.update) },
    { name: abilityEnum.delete, code: snakeCase(abilityEnum.delete) },
  ];

  await Promise.all(
    role.map(async (roleItem) => {
      await prisma.role.upsert({
        where: { name: roleItem.name },
        update: {},
        create: {
          name: roleItem.name,
          isSystem: true,
        },
      });
    }),
  );

  await prisma.user.update({
    where: { email: userEmailEnum.admin },
    data: { role: { connect: { name: roleEnum.Admin } } },
  });

  await prisma.user.update({
    where: { email: userEmailEnum.staff },
    data: { role: { connect: { name: roleEnum.Staff } } },
  });

  await Promise.all(
    permission.map(async (permissionItem) => {
      await prisma.permission.upsert({
        where: { code: permissionItem.code },
        update: {},
        create: {
          name: permissionItem.name,
          code: permissionItem.code,
        },
      });
    }),
  );

  await prisma.permission.update({
    where: { code: snakeCase(permissionEnum.bookingRequest) },
    data: {
      disableAbility: [
        snakeCase(abilityEnum.create),
        snakeCase(abilityEnum.read),
        snakeCase(abilityEnum.delete),
      ],
    },
  });

  await Promise.all(
    ability.map(async (abilityItem) => {
      await prisma.ability.upsert({
        where: { code: abilityItem.code },
        update: {},
        create: {
          name: abilityItem.name,
          code: abilityItem.code,
        },
      });
    }),
  );

  const rolePermission = [
    {
      role: roleEnum.Staff,
      permission: snakeCase(permissionEnum.room),
      ability: snakeCase(abilityEnum.read),
    },
    {
      role: roleEnum.Staff,
      permission: snakeCase(permissionEnum.booking),
      ability: snakeCase(abilityEnum.create),
    },
    {
      role: roleEnum.Staff,
      permission: snakeCase(permissionEnum.booking),
      ability: snakeCase(abilityEnum.read),
    },
    {
      role: roleEnum.Staff,
      permission: snakeCase(permissionEnum.booking),
      ability: snakeCase(abilityEnum.update),
    },
    {
      role: roleEnum.Staff,
      permission: snakeCase(permissionEnum.booking),
      ability: snakeCase(abilityEnum.delete),
    },
    {
      role: roleEnum.Admin,
      permission: snakeCase(permissionEnum.role),
      ability: snakeCase(abilityEnum.create),
    },
    {
      role: roleEnum.Admin,
      permission: snakeCase(permissionEnum.role),
      ability: snakeCase(abilityEnum.read),
    },
    {
      role: roleEnum.Admin,
      permission: snakeCase(permissionEnum.role),
      ability: snakeCase(abilityEnum.update),
    },
    {
      role: roleEnum.Admin,
      permission: snakeCase(permissionEnum.role),
      ability: snakeCase(abilityEnum.delete),
    },
    {
      role: roleEnum.Admin,
      permission: snakeCase(permissionEnum.user),
      ability: snakeCase(abilityEnum.create),
    },
    {
      role: roleEnum.Admin,
      permission: snakeCase(permissionEnum.user),
      ability: snakeCase(abilityEnum.read),
    },
    {
      role: roleEnum.Admin,
      permission: snakeCase(permissionEnum.user),
      ability: snakeCase(abilityEnum.update),
    },
    {
      role: roleEnum.Admin,
      permission: snakeCase(permissionEnum.user),
      ability: snakeCase(abilityEnum.delete),
    },
    {
      role: roleEnum.Admin,
      permission: snakeCase(permissionEnum.room),
      ability: snakeCase(abilityEnum.create),
    },
    {
      role: roleEnum.Admin,
      permission: snakeCase(permissionEnum.room),
      ability: snakeCase(abilityEnum.read),
    },
    {
      role: roleEnum.Admin,
      permission: snakeCase(permissionEnum.room),
      ability: snakeCase(abilityEnum.update),
    },
    {
      role: roleEnum.Admin,
      permission: snakeCase(permissionEnum.room),
      ability: snakeCase(abilityEnum.delete),
    },
    {
      role: roleEnum.Admin,
      permission: snakeCase(permissionEnum.booking),
      ability: snakeCase(abilityEnum.create),
    },
    {
      role: roleEnum.Admin,
      permission: snakeCase(permissionEnum.booking),
      ability: snakeCase(abilityEnum.read),
    },
    {
      role: roleEnum.Admin,
      permission: snakeCase(permissionEnum.booking),
      ability: snakeCase(abilityEnum.update),
    },
    {
      role: roleEnum.Admin,
      permission: snakeCase(permissionEnum.booking),
      ability: snakeCase(abilityEnum.delete),
    },
    {
      role: roleEnum.Admin,
      permission: snakeCase(permissionEnum.bookingRequest),
      ability: snakeCase(abilityEnum.update),
    },
  ];

  const getId = async (args: { module: any; where: any }) => {
    const module: any = prisma[args.module];
    const foundItem = await module.findUnique({ where: args.where });
    return foundItem.id;
  };

  await Promise.all(
    rolePermission.map(async (rolePermissionItem) => {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId_abilityId: {
            roleId: await getId({
              module: 'role',
              where: { name: rolePermissionItem.role },
            }),
            permissionId: await getId({
              module: 'permission',
              where: { code: rolePermissionItem.permission },
            }),
            abilityId: await getId({
              module: 'ability',
              where: { code: rolePermissionItem.ability },
            }),
          },
        },
        update: {},
        create: {
          role: { connect: { name: rolePermissionItem.role } },
          permission: { connect: { code: rolePermissionItem.permission } },
          ability: { connect: { code: rolePermissionItem.ability } },
        },
      });
    }),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
