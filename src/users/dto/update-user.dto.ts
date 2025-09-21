import {
  ApiPropertyOptional,
  IntersectionType,
  OmitType,
  PartialType,
} from '@nestjs/swagger';
import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { CreateUserDto } from './create-user.dto';
import { UpdateProfileDto } from './update-profile.dto';

class BaseWithoutPerfil extends OmitType(CreateUserDto, ['perfil'] as const) {}

class PartialWithoutPerfil extends PartialType(BaseWithoutPerfil) {}

class PerfilPartial {
  @ApiPropertyOptional({ type: UpdateProfileDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateProfileDto)
  perfil?: UpdateProfileDto;
}

export class UpdateUserDto extends IntersectionType(
  PartialWithoutPerfil,
  PerfilPartial,
) {}
