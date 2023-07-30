import { Injectable, NotFoundException } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { getCacheKey } from '../helpers/cache.helper';
import { FilterCrudDto } from './dto/filterCrud.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export abstract class CrudService {
  private readonly module: any;

  constructor(
    protected readonly prisma: PrismaService,
    protected readonly cacheManager: Cache,
    private readonly cacheName: string,
  ) {
    this.module = this.prisma[this.cacheName];
  }

  async removeCache(cacheName?: string) {
    const keys = await this.cacheManager.store.keys();
    let cacheNameRemove = this.cacheName;

    if (cacheName) {
      cacheNameRemove = cacheName;
    }

    keys.map(async (key) => {
      if (key.startsWith(cacheNameRemove)) {
        await this.cacheManager.del(key);
      }
    });
  }

  async foundByWhere(args: { where: any; include?: any }) {
    const query: any = {
      where: args.where,
    };

    if (args.include) {
      query.include = args.include;
    }

    const foundByWhere = await this.module.findMany(query);
    return foundByWhere;
  }

  async foundById(args: { id: number; include?: any }) {
    const cacheKey = getCacheKey({ cacheName: this.cacheName, name: args.id });
    const cacheItem = await this.cacheManager.get(cacheKey);

    if (!!cacheItem) {
      return cacheItem;
    }

    const query: any = { where: { id: args.id } };

    if (args.include) {
      query.include = args.include;
    }

    const foundById = await this.module.findUnique(query);

    if (!foundById) {
      throw new NotFoundException(`The ${this.cacheName} doesn’t existed`);
    }

    await this.cacheManager.set(cacheKey, foundById);

    return foundById;
  }

  async getList(args: { filterCrudDto: FilterCrudDto }) {
    const cacheKey = getCacheKey({
      cacheName: this.cacheName,
      name: args.filterCrudDto,
    });
    const cacheItem = await this.cacheManager.get(cacheKey);

    if (!!cacheItem) {
      return cacheItem;
    }

    const page = args.filterCrudDto.page;
    const size = args.filterCrudDto.size;
    const where = args.filterCrudDto.where;
    const select = args.filterCrudDto.select;
    const orderBy = args.filterCrudDto.orderBy;
    const include = args.filterCrudDto.include;

    const queryData: any = {
      where,
      orderBy,
    };

    if (page && size) {
      const skip = (page - 1) * size;
      queryData.take = size;
      queryData.skip = skip;
    }

    const total = await this.module.count({ where });

    if (select) {
      queryData.select = select;
    }

    if (include) {
      queryData.include = include;
    }

    const lists = await this.module.findMany(queryData);

    const nextPage = page + 1 > Math.ceil(total / size) ? null : page + 1;
    const prevPage = page - 1 < 1 ? null : page - 1;

    const data = {
      list: lists,
      total,
      currentPage: page ?? 1,
      nextPage,
      prevPage,
      pageSize: size ?? total,
    };

    await this.cacheManager.set(cacheKey, data);

    return data;
  }

  async createData(args: { data: any }) {
    const createData = await this.module.create({
      data: args.data,
    });

    await this.removeCache();
    return createData;
  }

  async updateData(args: { where: any; data: any; include?: any }) {
    const query: any = {
      where: args.where,
      data: args.data,
    };

    if (args.include) {
      query.include = args.include;
    }

    const updateData = await this.module.update(query);

    await this.removeCache();

    return updateData;
  }

  async removeData(args: { where: any }) {
    await this.module.delete({ where: args.where });

    await this.removeCache();
  }
}
