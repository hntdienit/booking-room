import {
  Body,
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginUserDto } from './dto/loginUser.dto';
import { ForgotPasswordUserDto } from './dto/forgotPasswordUser.dto';
import { ResetPasswordUserDto } from './dto/resetPasswordUser.dto';
import { User } from '../users/user.decorator';
import { AuthGuard } from './auth.guard';
import { RequestUserDto } from '../users/dto/requestUser.dto';
import { TransformDtoInterceptor } from '../share/TransformDtoInterceptor.share';
import { UserDto } from '../users/dto/user.dto';
import { RefreshTokenUserDto } from './dto/refreshTokenUser.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @UseInterceptors(new TransformDtoInterceptor(UserDto))
  @ApiOkResponse({
    description: 'message: Logged in successfully and set cookie',
  })
  async login(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'message: Logged out successfully' })
  logout(@User() user: RequestUserDto) {
    return this.authService.logout(user);
  }

  @Post('forgot-password')
  async forgotpass(@Body() forgotPasswordUserDto: ForgotPasswordUserDto) {
    return this.authService.forgotpass(forgotPasswordUserDto);
  }

  @Post('reset-password')
  async resetpassword(@Body() resetPasswordUserDto: ResetPasswordUserDto) {
    return this.authService.resetpassword(resetPasswordUserDto);
  }

  @Post('refresh-token')
  refreshToken(@Body() refreshTokenUserDto: RefreshTokenUserDto) {
    return this.authService.refreshToken(refreshTokenUserDto);
  }
}
