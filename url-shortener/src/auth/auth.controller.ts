import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  UsePipes,
  ValidationPipe,
  LoggerService,
  Inject,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { OptionalAuthGuard } from './guards/optional-auth-guard';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  @Post('register')
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ summary: 'Registrar um novo usuário' })
  @ApiResponse({ status: 201, description: 'Usuário registrado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados de entrada inválidos' })
  create(@Body() registerDto: CreateAuthDto) {
    this.logger.log('Handling register request');
    return this.authService.register(registerDto);
  }

  @Post('login')
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ summary: 'Login do usuário' })
  @ApiResponse({ status: 200, description: 'Login bem-sucedido' })
  @ApiResponse({ status: 400, description: 'Dados de entrada inválidos' })
  async login(@Body() loginDto: UpdateAuthDto) {
    this.logger.log('Handling login request');
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
