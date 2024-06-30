import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateAuthDto {
  @ApiProperty({
    example: 'usuario@example.com',
    description: 'O email do usuário',
  })
  @MaxLength(255)
  @IsEmail({}, { message: 'Por favor, forneça um endereço de email válido' })
  @IsNotEmpty({ message: 'O email é obrigatório' })
  email: string;

  @ApiProperty({ example: 'senha123', description: 'A senha do usuário' })
  @MaxLength(25)
  @IsNotEmpty({ message: 'A senha é obrigatória' })
  password: string;

  @ApiProperty({ example: 'senha123', description: 'A confirmação da senha' })
  @MaxLength(25)
  confirmPassword?: string | null;
}
