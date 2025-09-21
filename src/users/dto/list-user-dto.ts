import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class ListUsersDto {
  @ApiPropertyOptional({ description: 'Texto a filtrar (nombre, correo, perfil)' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  q?: string;
}
