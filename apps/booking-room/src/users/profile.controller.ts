import {
  Body,
  Controller,
  Get,
  Patch,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';

import { User } from './user.decorator';
import { AuthGuard } from '../auth/auth.guard';
import { UpdateProfileDto } from './dto/updateProfile.dto';
import { RequestUserDto } from './dto/requestUser.dto';
import { ProfileService } from './profile.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from '../files/files.service';
import { TransformDtoInterceptor } from '../share/TransformDtoInterceptor.share';
import { UserDto } from './dto/user.dto';

@ApiTags('profile')
@Controller('profile')
@UseGuards(AuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @UseInterceptors(new TransformDtoInterceptor(UserDto))
  @ApiBearerAuth()
  getProfile(@User() user: RequestUserDto) {
    return this.profileService.getProfile(user);
  }

  @Patch()
  @UseInterceptors(new TransformDtoInterceptor(UserDto))
  @ApiBearerAuth()
  updateProfile(
    @User() user: RequestUserDto,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.profileService.updateProfile(user, updateProfileDto);
  }

  @Patch('avatar')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { avatar: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('avatar', FilesService.multerOptions({ fileSize: 5 })),
  )
  async uploadAvatar(
    @User() user: RequestUserDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.profileService.uploadAvatar(user, file);
  }
}
