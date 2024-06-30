import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUrl } from 'class-validator';

export class UpdateShortUrlDto {
  @ApiProperty({
    example: 'https://new-example.com',
    description: 'A nova URL original',
  })
  @IsNotEmpty({ message: 'A nova URL original é obrigatória' })
  @IsUrl({}, { message: 'Por favor, forneça uma nova URL válida' })
  newOriginalUrl: string;
}
