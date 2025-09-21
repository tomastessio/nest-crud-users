import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entities';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Listar usuarios' })
  @ApiOkResponse({
    description: 'Lista de usuarios',
    type: [User],
  })
  findAll(): User[] {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un usuario por ID' })
  @ApiOkResponse({ description: 'Usuario encontrado', type: User })
  @ApiBadRequestResponse({ description: 'ID inválido' })
  findOne(@Param('id', ParseIntPipe) id: number): User {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear usuario' })
  @ApiCreatedResponse({
    description: 'Usuario creado',
    type: User,
  })
  @ApiBadRequestResponse({ description: 'Body inválido' })
  @ApiConflictResponse({ description: 'Correo electrónico duplicado' })
  create(
    @Body()
    dto: CreateUserDto,
  ): User {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar usuario parcialmente' })
  @ApiOkResponse({ description: 'Usuario actualizado', type: User })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  @ApiConflictResponse({ description: 'Correo electrónico duplicado' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ): User {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar usuario' })
  @ApiOkResponse({ description: 'Usuario eliminado (void)' })
  @ApiBadRequestResponse({ description: 'ID inválido' })
  remove(@Param('id', ParseIntPipe) id: number): void {
    return this.service.remove(id);
  }
}
