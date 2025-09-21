import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateProfileDto } from './create-profile.dto';

export class CreateUserDto {

  @ApiProperty({ example: 'Tomas Tessio' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ example: 'tomas@example.com' })
  @IsEmail()
  correoElectronico: string;

  @ApiProperty({ example: 28, minimum: 0 })
  @IsInt()
  @Min(0)
  @IsPositive()
  edad: number;

  @ApiProperty({ type: CreateProfileDto })
  @ValidateNested()
  @Type(() => CreateProfileDto)
  perfil: CreateProfileDto;
  
}
