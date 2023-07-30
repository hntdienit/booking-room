import { v5 as uuidv5 } from 'uuid';
import { snakeCase } from 'change-case';
import { MY_NAMESPACE } from '../constants/cache.constant';

export const getCacheKey = (args: { cacheName: string; name: any }) => {
  const name = uuidv5(
    JSON.stringify(args.name),
    MY_NAMESPACE,
  );
  const nameCacheKey = `${args.cacheName}_${name}`;

  return snakeCase(nameCacheKey);
};
