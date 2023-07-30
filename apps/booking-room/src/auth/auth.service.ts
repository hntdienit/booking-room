import {
  BadRequestException,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { LoginUserDto } from './dto/loginUser.dto';
import { compareBcrypt, hashBcrypt } from '../helpers/hash.helper';
import { UserDto } from '../users/dto/user.dto';
import { UsersService } from '../users/users.service';
import { ForgotPasswordUserDto } from './dto/forgotPasswordUser.dto';
import { sendMailEvent } from '../mail/events/sendMail.event';
import { ResetPasswordUserDto } from './dto/resetPasswordUser.dto';
import { saltOrRounds } from '../constants/common.constant';
import { MailEventEnum } from '../mail/mail.enum';
import {
  MSG_ACCOUNT_DEACTIVATED,
  MSG_CREDENTIAL_IS_INCORRECT,
  MSG_EMAIL_IS_NOT_EXIST,
  MSG_ERROR_INVALID_RESET_PASS_TOKEN,
  MSG_LOGIN_SUCCESSFULLY,
  MSG_LOGOUT_SUCCESSFULLY,
  MSG_NEW_TOKEN,
  MSG_REFRESH_TOKEN_NOT_VALID,
  MSG_RESET_PASS_SUCCESSFULLY,
  MSG_SEND_RESET_PASS_EMAIL_SUCCESSFULLY,
} from '../constants/message.constant';
import { RequestUserDto } from '../users/dto/requestUser.dto';
import { RefreshTokenUserDto } from './dto/refreshTokenUser.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UsersService,
    private readonly configService: ConfigService,
    private readonly jwt: JwtService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private async getAccessToken(args: { user: UserDto }) {
    const accessToken = await this.jwt.signAsync(
      { id: args.user.id, email: args.user.email },
      {
        secret: this.configService.get('JWT_SECRET_ACCESSTOKEN'),
        expiresIn: this.configService.get('JWT_EXPIRES_IN_ACCESSTOKEN'),
      },
    );

    return accessToken;
  }

  async login(loginUserDto: LoginUserDto) {
    const findUser = await this.userService.foundUserByEmail({
      email: loginUserDto.email,
    });

    if (!findUser) {
      throw new BadRequestException(MSG_EMAIL_IS_NOT_EXIST);
    }

    const isMatch = await compareBcrypt({
      strNeedCompare: loginUserDto.password,
      hash: findUser.password,
    });

    if (!isMatch) {
      throw new BadRequestException(MSG_CREDENTIAL_IS_INCORRECT);
    }

    if (!findUser.isActive) {
      throw new BadRequestException(MSG_ACCOUNT_DEACTIVATED);
    }

    const accessToken = await this.getAccessToken({ user: findUser });

    let refreshToken: string;
    if (loginUserDto.isRemember) {
      refreshToken = await this.jwt.signAsync(
        { id: findUser.id, email: findUser.email },
        {
          secret: this.configService.get('JWT_SECRET_REFRESHTOKEN'),
          expiresIn: this.configService.get('JWT_EXPIRES_IN_REFRESHTOKEN'),
        },
      );

      const newRefreshToken = refreshToken.slice(refreshToken.lastIndexOf('.'));

      const refreshTokenHash = await hashBcrypt({
        strNeedHash: newRefreshToken,
        salt: saltOrRounds,
      });

      await this.userService.updateData({
        where: { id: findUser.id },
        data: { refreshToken: refreshTokenHash },
      });
    }

    return {
      message: MSG_LOGIN_SUCCESSFULLY,
      item: findUser,
      AccessToken: accessToken,
      RefreshToken: refreshToken,
    };
  }

  async logout(user: RequestUserDto) {
    await this.userService.updateData({
      where: { id: user.id },
      data: { refreshToken: null },
    });

    return { message: MSG_LOGOUT_SUCCESSFULLY };
  }

  async refreshToken(refreshTokenUserDto: RefreshTokenUserDto) {
    let verify;
    try {
      verify = await this.jwt.verifyAsync(refreshTokenUserDto.refreshToken, {
        secret: this.configService.get('JWT_SECRET_REFRESHTOKEN'),
      });
    } catch (err) {
      throw new ForbiddenException();
    }

    const findUser = await this.userService.foundUserByEmail({
      email: verify.email,
    });

    if (!findUser) {
      throw new BadRequestException(MSG_EMAIL_IS_NOT_EXIST);
    }

    try {
      const newRefreshToken = refreshTokenUserDto.refreshToken.slice(
        refreshTokenUserDto.refreshToken.lastIndexOf('.'),
      );

      const checkRefreshToken = await compareBcrypt({
        strNeedCompare: newRefreshToken,
        hash: findUser.refreshToken,
      });

      if (!checkRefreshToken) {
        throw new ForbiddenException();
      }
    } catch {
      throw new BadRequestException(MSG_REFRESH_TOKEN_NOT_VALID);
    }

    const accessToken = await this.getAccessToken({ user: findUser });

    const refreshToken = await this.jwt.signAsync(
      { id: findUser.id, email: findUser.email },
      {
        secret: this.configService.get('JWT_SECRET_REFRESHTOKEN'),
        expiresIn: this.configService.get('JWT_EXPIRES_IN_REFRESHTOKEN'),
      },
    );

    const newRefreshToken = refreshToken.slice(refreshToken.lastIndexOf('.'));

    const refreshTokenHash = await hashBcrypt({
      strNeedHash: newRefreshToken,
      salt: saltOrRounds,
    });

    await this.userService.updateData({
      where: { id: findUser.id },
      data: { refreshToken: refreshTokenHash },
    });

    return {
      message: MSG_NEW_TOKEN,
      AccessToken: accessToken,
      RefreshToken: refreshToken,
    };
  }

  async forgotpass(forgotPasswordUserDto: ForgotPasswordUserDto) {
    const findUser = await this.userService.foundUserByEmail({
      email: forgotPasswordUserDto.email,
    });

    if (!findUser) {
      throw new BadRequestException(MSG_EMAIL_IS_NOT_EXIST);
    }

    const resetPasswordJwtToken = await this.jwt.signAsync(
      { id: findUser.id, email: findUser.email },
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

    await this.userService.updateData({
      where: { email: findUser.email },
      data: { resetPasswordHash: hash },
    });

    const sendMail = new sendMailEvent();
    sendMail.email = findUser.email;
    sendMail.subject = 'reset password';
    sendMail.template = './reset-password';
    sendMail.context = {
      url: `${this.configService.get(
        'CLIENT_HOST',
      )}/reset-password?jwt=${resetPasswordJwtToken}`,
    };

    this.eventEmitter.emit(MailEventEnum.sendMailListener, sendMail);
    return { message: MSG_SEND_RESET_PASS_EMAIL_SUCCESSFULLY };
  }

  async resetpassword(resetPasswordUserDto: ResetPasswordUserDto) {
    let verify: any;
    try {
      verify = await this.jwt.verifyAsync(resetPasswordUserDto.jwt, {
        secret: this.configService.get('JWT_SECRET_RESET_PASSWORD'),
      });
    } catch (err) {
      throw new BadRequestException(MSG_ERROR_INVALID_RESET_PASS_TOKEN);
    }
    const findUser = await this.userService.foundUserByEmail({
      email: verify.email,
    });

    const newResetPasswordUserDtoJwt = resetPasswordUserDto.jwt.slice(
      resetPasswordUserDto.jwt.lastIndexOf('.'),
    );

    const isMatch = await compareBcrypt({
      strNeedCompare: newResetPasswordUserDtoJwt,
      hash: findUser.resetPasswordHash,
    });

    if (!isMatch) {
      throw new BadRequestException(MSG_ERROR_INVALID_RESET_PASS_TOKEN);
    }

    const hashPassword = await hashBcrypt({
      strNeedHash: resetPasswordUserDto.newPassword,
      salt: saltOrRounds,
    });

    await this.userService.updateData({
      where: { email: findUser.email },
      data: { password: hashPassword, resetPasswordHash: null },
    });
    return { message: MSG_RESET_PASS_SUCCESSFULLY };
  }
}
