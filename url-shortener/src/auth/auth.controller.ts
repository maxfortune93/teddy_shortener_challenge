import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { OptionalAuthGuard } from './guards/optional-auth-guard';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ summary: 'Registrar um novo usuário' })
  @ApiResponse({ status: 201, description: 'Usuário registrado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados de entrada inválidos' })
  create(@Body() registerDto: CreateAuthDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ summary: 'Login do usuário' })
  @ApiResponse({ status: 200, description: 'Login bem-sucedido' })
  @ApiResponse({ status: 400, description: 'Dados de entrada inválidos' })
  async login(@Body() loginDto: UpdateAuthDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(OptionalAuthGuard)
  // @UseGuards(JwtGuard)
  @Get()
  findAll(@Request() req) {
    const userEmail = req.user;
    console.log(userEmail);
    return this.authService.findAll();
  }
}
