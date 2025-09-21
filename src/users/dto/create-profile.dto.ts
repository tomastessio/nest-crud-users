import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateProfileDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  id: number;

  @ApiProperty({ example: 'ADM' })
  @IsString()
  @IsNotEmpty()
  codigo: string;

  @ApiProperty({ example: 'Administrador' })
  @IsString()
  @IsNotEmpty()
  nombrePerfil: string;
}
