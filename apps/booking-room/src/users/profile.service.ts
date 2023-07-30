import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  MSG_ERROR_UPLOAD_AVATAR_FAIL,
  MSG_UPLOAD_AVATAR_SUCCESSFULLY,
  MSG_UPLOAD_PROFILE_SUCCESSFULLY,
} from '../constants/message.constant';
import { UpdateProfileDto } from './dto/updateProfile.dto';
import { RequestUserDto } from './dto/requestUser.dto';
import { UsersService } from './users.service';
import { FilesService } from '../files/files.service';
import { FilesEnum } from '../files/files.enum';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { removeFileEvent } from '../files/events/files.event';
import { FileEventEnum } from '../files/fileEvent.enum';
import { AvatarDefault } from '../constants/common.constant';
import { PrismaService } from '../prisma/prisma.service';
import { ArrayPermissionAbilityCasl } from '../helpers/arrayHandle.helper';
import { getCacheKey } from '../helpers/cache.helper';
import { PERMISSIONABILITYCASL_CACHE } from '../constants/cache.constant';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UsersService,
    private readonly filesService: FilesService,
    private readonly eventEmitter: EventEmitter2,
    @Inject(CACHE_MANAGER) protected readonly cacheManager: Cache,
  ) {}

  async getProfile(user: RequestUserDto) {
    const profileUser = await this.userService.foundById({
      id: user.id,
      include: {
        role: { select: { name: true } },
      },
    });

    let permissionsUser;

    const cacheKey = getCacheKey({
      cacheName: PERMISSIONABILITYCASL_CACHE,
      name: user.id,
    });
    const cacheItem = await this.cacheManager.get(cacheKey);

    if (cacheItem) {
      return cacheItem;
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

      await this.cacheManager.set(cacheKey, {
        item: profileUser,
        rolePermissions: permissionsUser,
      });
    }

    return { item: profileUser, rolePermissions: permissionsUser };
  }

  async updateProfile(
    user: RequestUserDto,
    updateProfileDto: UpdateProfileDto,
  ) {
    const updateProfile = await this.userService.updateData({
      where: { id: user.id },
      data: updateProfileDto,
    });

    return {
      item: updateProfile,
      message: MSG_UPLOAD_PROFILE_SUCCESSFULLY,
    };
  }

  async uploadAvatar(user: RequestUserDto, file: Express.Multer.File) {
    const uploadFile = await this.filesService.uploadFile({
      file: file,
      folder: FilesEnum.avatars,
    });

    try {
      const findUser = await this.userService.foundById({ id: user.id });
      const avatarOld = findUser.avatarUrl;

      await this.userService.updateData({
        where: { id: user.id },
        data: { avatarUrl: uploadFile.secure_url },
      });

      if (avatarOld !== AvatarDefault) {
        const removeFile = new removeFileEvent(FilesEnum.avatars, avatarOld);
        this.eventEmitter.emit(FileEventEnum.removeFileListener, removeFile);
      }
    } catch {
      const removeFile = new removeFileEvent(
        FilesEnum.avatars,
        uploadFile.secure_url,
      );

      this.eventEmitter.emit(FileEventEnum.removeFileListener, removeFile);
      throw new BadRequestException(MSG_ERROR_UPLOAD_AVATAR_FAIL);
    }

    return {
      item: uploadFile.secure_url,
      message: MSG_UPLOAD_AVATAR_SUCCESSFULLY,
    };
  }
}
