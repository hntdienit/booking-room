import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/createUser.dto';
import { AuthGuard } from '../auth/auth.guard';
import { UserDto } from './dto/user.dto';
import { UpdateUserDto } from './dto/updateUser.dto';
import { FilterUserDto } from './dto/filterUser.dto';
import { TransformDtoInterceptor } from '../share/TransformDtoInterceptor.share';
import { FilterPublicUserDto } from './dto/filterPublicUser.dto';
import { RolePermissionsGuard } from '../role-permissions/role-permission.guard';
import { RolePermissions } from '../role-permissions/role-permissions.decorator';
import { AppAbility } from '../casl/casl-ability.factory';
import { PermissionsCodeEnum } from '../permissions/permissions.enum';
import { AbilitiesCodeEnum } from '../abilities/abilities.enum';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(AuthGuard, RolePermissionsGuard)
  @RolePermissions((ability: AppAbility) =>
    ability.can(PermissionsCodeEnum.User, AbilitiesCodeEnum.Create),
  )
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'message: Create user successfully' })
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }

  @Post('list')
  @UseInterceptors(new TransformDtoInterceptor(UserDto))
  @UseGuards(AuthGuard, RolePermissionsGuard)
  @RolePermissions((ability: AppAbility) =>
    ability.can(PermissionsCodeEnum.User, AbilitiesCodeEnum.Read),
  )
  @ApiBearerAuth()
  @ApiOkResponse({ type: UserDto, isArray: true })
  async getListUser(@Body() filterUserDto: FilterUserDto) {
    return this.usersService.getListUser(filterUserDto);
  }

  @Post('list-public')
  @UseInterceptors(new TransformDtoInterceptor(UserDto))
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async getListUserPublic(@Body() filterPublicUserDto: FilterPublicUserDto) {
    return this.usersService.getListUserPublic(filterPublicUserDto);
  }

  @Get(':id')
  @UseInterceptors(new TransformDtoInterceptor(UserDto))
  @UseGuards(AuthGuard, RolePermissionsGuard)
  @RolePermissions((ability: AppAbility) =>
    ability.can(PermissionsCodeEnum.User, AbilitiesCodeEnum.Read),
  )
  @ApiBearerAuth()
  @ApiOkResponse({ type: UserDto })
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getUserById(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RolePermissionsGuard)
  @RolePermissions((ability: AppAbility) =>
    ability.can(PermissionsCodeEnum.User, AbilitiesCodeEnum.Update),
  )
  @ApiBearerAuth()
  @ApiOkResponse({
    type: UserDto,
    description: 'message: Edit user successfully',
  })
  updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updateUser(id, updateUserDto);
  }
}
