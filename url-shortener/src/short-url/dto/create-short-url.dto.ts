import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUrl } from 'class-validator';

export class CreateShortUrlDto {
  @ApiProperty({
    example: 'https://example.com',
    description: 'A URL original para ser encurtada',
  })
  @IsNotEmpty({ message: 'A URL original é obrigatória' })
  @IsUrl({}, { message: 'Por favor, forneça uma URL válida' })
  originalUrl: string;
}
