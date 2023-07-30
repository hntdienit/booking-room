import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { v4 as uuid4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { AvatarDefault, saltOrRounds } from '../constants/common.constant';
import { hashBcrypt } from '../helpers/hash.helper';
import { CreateUserDto } from './dto/createUser.dto';
import {
  MSG_CREATE_USER_SUCCESSFULLY,
  MSG_EMAIL_BE_WAS_EXIST,
  MSG_ERROR_ROLE_IS_NOT_EXIST,
  MSG_UPDATE_USER_SUCCESSFULLY,
} from '../constants/message.constant';
import { sendMailEvent } from '../mail/events/sendMail.event';
import { MailEventEnum } from '../mail/mail.enum';
import { UpdateUserDto } from './dto/updateUser.dto';
import { FilterUserDto } from './dto/filterUser.dto';
import {
  PERMISSIONABILITYCASL_CACHE,
  USER_CACHE,
} from '../constants/cache.constant';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CrudService } from '../crud/crud.service';
import { FilterPublicUserDto } from './dto/filterPublicUser.dto';
import { ArrayPermissionAbilityCasl } from '../helpers/arrayHandle.helper';
import { getCacheKey } from '../helpers/cache.helper';

@Injectable()
export class UsersService extends CrudService {
  constructor(
    protected readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly jwt: JwtService,
    private readonly eventEmitter: EventEmitter2,
    @Inject(CACHE_MANAGER) protected readonly cacheManager: Cache,
  ) {
    super(prisma, cacheManager, USER_CACHE);
  }

  private async checkRoleExists(args: { roleId: number }) {
    const isRoleExists = await this.prisma.role.findUnique({
      where: { id: args.roleId },
    });

    if (!isRoleExists) {
      throw new NotFoundException(MSG_ERROR_ROLE_IS_NOT_EXIST);
    }
  }

  async foundUserByEmail(args: { email: string }) {
    const foundUser = await this.prisma.user.findUnique({
      where: { email: args.email },
    });
    return foundUser;
  }

  async createUser(createUserDto: CreateUserDto) {
    const isEmailExists = await this.foundUserByEmail({
      email: createUserDto.email,
    });

    if (isEmailExists) {
      throw new BadRequestException(MSG_EMAIL_BE_WAS_EXIST);
    }

    await this.checkRoleExists({ roleId: createUserDto.roleId });

    const hashPassword = await hashBcrypt({
      strNeedHash: uuid4(),
      salt: saltOrRounds,
    });

    const createUser = await this.createData({
      data: {
        ...createUserDto,
        avatarUrl: AvatarDefault,
        password: hashPassword,
      },
    });

    const resetPasswordJwtToken = await this.jwt.signAsync(
      { id: createUser.id, email: createUser.email },
      {
        secret: this.configService.get('JWT_SECRET_RESET_PASSWORD'),
        expiresIn: this.configService.get('JWT_EXPIRES_RESET_PASSWORD'),
      },
    );

    const newResetPasswordJwtToken = resetPasswordJwtToken.slice(
      resetPasswordJwtToken.lastIndexOf('.'),
    );

    const hash = await hashBcrypt({
      strNeedHash: newResetPasswordJwtToken,
      salt: saltOrRounds,
    });

    await this.updateData({
      where: { id: createUser.id },
      data: { resetPasswordHash: hash },
    });

    const sendMail = new sendMailEvent();
    sendMail.email = createUser.email;
    sendMail.subject = 'Reset password';
    sendMail.template = './reset-password';
    sendMail.context = {
      url: `${this.configService.get(
        'CLIENT_HOST',
      )}/reset-password?jwt=${resetPasswordJwtToken}`,
    };

    this.eventEmitter.emit(MailEventEnum.sendMailListener, sendMail);

    return { message: MSG_CREATE_USER_SUCCESSFULLY };
  }

  async updateUser(id: number, updateUserDto: UpdateUserDto) {
    if (updateUserDto.roleId) {
      await this.checkRoleExists({ roleId: updateUserDto.roleId });
    }

    const updateUser = await this.updateData({
      where: { id },
      data: updateUserDto,
    });

    return {
      item: updateUser,
      message: MSG_UPDATE_USER_SUCCESSFULLY,
    };
  }

  async getListUser(filterUserDto: FilterUserDto) {
    const lists = await this.getList({ filterCrudDto: filterUserDto });

    return lists;
  }

  async getUserById(id: number) {
    const user = await this.foundById({
      id,
      include: {
        role: { select: { name: true } },
      },
    });

    let permissionsUser;

    const cacheKey = getCacheKey({
      cacheName: PERMISSIONABILITYCASL_CACHE,
      name: id,
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
          where: { userId: id },
          include: { permission: true, ability: true },
        }),
      ]);

      permissionsUser = ArrayPermissionAbilityCasl({
        rolePermission: rolePermissionsUser,
        userPermission: userPermissionsUser,
      });

      await this.cacheManager.set(cacheKey, {
        item: user,
        rolePermissions: permissionsUser,
      });
    }

    return { item: user, rolePermissions: permissionsUser };
  }

  async getListUserPublic(filterPublicUserDto: FilterPublicUserDto) {
    filterPublicUserDto['select'] = { id: true, fullName: true, roleId: true };
    const lists = await this.getList({ filterCrudDto: filterPublicUserDto });

    return lists;
  }
}
