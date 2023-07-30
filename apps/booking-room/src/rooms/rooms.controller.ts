import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/createRoom.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RoomDto } from './dto/room.dto';
import { FilterRoomDto } from './dto/filterRoom.dto';
import { UpdateRoomDto } from './dto/updateRoom.dto';
import { TransformDtoInterceptor } from '../share/TransformDtoInterceptor.share';
import { RolePermissionsGuard } from '../role-permissions/role-permission.guard';
import { RolePermissions } from '../role-permissions/role-permissions.decorator';
import { AppAbility } from '../casl/casl-ability.factory';
import { AbilitiesCodeEnum } from '../abilities/abilities.enum';
import { PermissionsCodeEnum } from '../permissions/permissions.enum';

@ApiTags('rooms')
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @UseGuards(AuthGuard, RolePermissionsGuard)
  @RolePermissions((ability: AppAbility) =>
    ability.can(PermissionsCodeEnum.Room, AbilitiesCodeEnum.Create),
  )
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'message: Create room successfully' })
  async createRoom(@Body() createRoomDto: CreateRoomDto) {
    return this.roomsService.createRoom(createRoomDto);
  }

  @Post('list')
  @UseInterceptors(new TransformDtoInterceptor(RoomDto))
  @UseGuards(AuthGuard, RolePermissionsGuard)
  @RolePermissions((ability: AppAbility) =>
    ability.can(PermissionsCodeEnum.Room, AbilitiesCodeEnum.Read),
  )
  @ApiBearerAuth()
  @ApiOkResponse({ type: RoomDto, isArray: true })
  async getListRoom(@Body() filterRoomDto: FilterRoomDto) {
    return this.roomsService.getListRoom(filterRoomDto);
  }

  @Get(':id')
  @UseInterceptors(new TransformDtoInterceptor(RoomDto))
  @UseGuards(AuthGuard, RolePermissionsGuard)
  @RolePermissions((ability: AppAbility) =>
    ability.can(PermissionsCodeEnum.Room, AbilitiesCodeEnum.Read),
  )
  @ApiBearerAuth()
  @ApiOkResponse({ type: RoomDto })
  async getRoomById(@Param('id', ParseIntPipe) id: number) {
    return this.roomsService.getRoomById(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RolePermissionsGuard)
  @RolePermissions((ability: AppAbility) =>
    ability.can(PermissionsCodeEnum.Room, AbilitiesCodeEnum.Update),
  )
  @ApiBearerAuth()
  @ApiOkResponse({ type: RoomDto })
  updateRoom(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoomDto: UpdateRoomDto,
  ) {
    return this.roomsService.updateRoom(id, updateRoomDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolePermissionsGuard)
  @RolePermissions((ability: AppAbility) =>
    ability.can(PermissionsCodeEnum.Room, AbilitiesCodeEnum.Delete),
  )
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'message: Delete room successfully' })
  removeRoom(@Param('id', ParseIntPipe) id: number) {
    return this.roomsService.removeRoom(id);
  }
}
