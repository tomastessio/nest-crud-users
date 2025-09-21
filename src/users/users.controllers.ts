import {
  Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiHeader,
  ApiParam,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ListUsersDto } from './dto/list-user-dto';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '../auth/roles.enum';

@ApiTags('users') // Agrupo los endpoints bajo la tag "users" en Swagger
@UseGuards(RolesGuard) // Activo el guard de roles a nivel controller (aplica a todas las rutas)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Listar usuarios (con filtro de texto opcional)' })
  @ApiOkResponse({ description: 'Lista de usuarios' })
  @ApiQuery({ name: 'q', required: false, description: 'Texto a filtrar (nombre, correo, perfil)' })
  // Expondo el query param "q" tipado con ListUsersDto para que Swagger muestre el filtro.
  findAll(@Query() query: ListUsersDto) {
    // Delego el filtro al servicio; si no viene "q" retorna todo.
    return this.usersService.findAll(query.q);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener usuario por ID' })
  @ApiOkResponse({ description: 'Usuario encontrado' })
  @ApiParam({
    name: 'id',
    description: 'ID numérico del usuario',
    schema: { type: 'integer', example: 1 },
    required: true,
  })
  // Convertir con +id porque el almacenamiento es en memoria y usa number como clave.
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id); // in-memory usa number
  }

  @Post()
  @Roles(Role.ADMIN) // Solo ADMIN puede crear; el guard valida el header x-role.
  @ApiHeader({
    name: 'x-role',
    description: 'Rol requerido para esta operación',
    required: true,
    schema: { type: 'string', enum: [Role.ADMIN, Role.USER], default: Role.ADMIN },
  })
  @ApiOperation({ summary: 'Crear usuario (requiere ADMIN)' })
  @ApiCreatedResponse({ description: 'Usuario creado' })
  @ApiBadRequestResponse({ description: 'Body inválido' })
  @ApiConflictResponse({ description: 'Correo electrónico duplicado' })
  // Swagger documenta el payload con CreateUserDto.
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN) // Update también restringido a ADMIN vía header x-role
  @ApiHeader({
    name: 'x-role',
    description: 'Rol requerido para esta operación',
    required: true,
    schema: { type: 'string', enum: [Role.ADMIN, Role.USER], default: Role.ADMIN },
  })
  @ApiOperation({ summary: 'Actualizar usuario parcialmente (requiere ADMIN)' })
  @ApiOkResponse({ description: 'Usuario actualizado' })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  @ApiConflictResponse({ description: 'Correo electrónico duplicado' })
  @ApiParam({
    name: 'id',
    description: 'ID numérico del usuario',
    schema: { type: 'integer', example: 1 },
    required: true,
  })
  // Uso UpdateUserDto para permitir parches parciales (DTO ya marca opcionales).
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(+id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN) // Delete también requiere rol ADMIN
  @ApiHeader({
    name: 'x-role',
    description: 'Rol requerido para esta operación',
    required: true,
    schema: { type: 'string', enum: [Role.ADMIN, Role.USER], default: Role.ADMIN },
  })
  @ApiOperation({ summary: 'Eliminar usuario (requiere ADMIN)' })
  @ApiOkResponse({ description: 'Usuario eliminado' })
  @ApiParam({
    name: 'id',
    description: 'ID numérico del usuario',
    schema: { type: 'integer', example: 1 },
    required: true,
  })
  // No retorno body; si no existe el id, el service tira 404 con mensaje consistente.
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
