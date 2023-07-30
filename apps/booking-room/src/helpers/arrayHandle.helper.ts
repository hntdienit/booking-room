export const ArrayPermissionAbilityCasl = (args: {
  rolePermission: any;
  userPermission: any;
}) => {
  const arr = [];
  const arrFalse = [];

  for (let i = 0; i < args.userPermission.length; i++) {
    if (args.userPermission[i].isEnable === true) {
      arr.push({
        permission: args.userPermission[i].permission,
        ability: args.userPermission[i].ability,
      });
    }

    if (args.userPermission[i].isEnable === false) {
      arrFalse.push(
        JSON.stringify({
          permission: args.userPermission[i].permission,
          ability: args.userPermission[i].ability,
        }),
      );
    }
  }

  for (let i = 0; i < args.rolePermission.length; i++) {
    if (
      !arrFalse.includes(
        JSON.stringify({
          permission: args.rolePermission[i].permission,
          ability: args.rolePermission[i].ability,
        }),
      )
    ) {
      arr.push({
        permission: args.rolePermission[i].permission,
        ability: args.rolePermission[i].ability,
      });
    }
  }

  return arr;
};
