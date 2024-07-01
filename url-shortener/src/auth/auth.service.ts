import {
  ConflictException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  LoggerService,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma/prisma.service';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

@Injectable()
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  private async hashPassword(password: string) {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  async register(registerDto: CreateAuthDto) {
    this.logger.log(`Attempting to register user: ${registerDto.email}`);
    if (registerDto.password !== registerDto.confirmPassword) {
      this.logger.warn('Password and confirm password do not match');
      throw new UnprocessableEntityException('As senhas não conferem');
    }

    const existingUser = await this.findOneWithEmail(registerDto.email);

    if (existingUser) {
      throw new ConflictException('O email já está em uso');
    }

    const hashedPassword = await this.hashPassword(registerDto.password);
    const user = await this.prismaService.user.create({
      data: {
        email: registerDto.email,
        password: hashedPassword,
      },
    });
    this.logger.log(`User registered successfully: ${user.email}`);
    return user;
  }

  async login(loginDto: UpdateAuthDto) {
    this.logger.log(`Attempting to login user: ${loginDto.email}`);

    const user = await this.findOneWithEmail(loginDto.email);
    if (!user || !(await bcrypt.compare(loginDto.password, user.password))) {
      this.logger.warn('Invalid credentials provided');
      throw new HttpException('Senha Inválida', HttpStatus.UNAUTHORIZED);
    }

    const token = this.jwtService.sign({ userId: user.id });
    this.logger.log(`User logged in successfully: ${user.email}`);
    return { token };
  }

  async findOneWithEmail(userEmail: string) {
    return await this.prismaService.user.findUnique({
      where: { email: userEmail },
    });
  }

  async findAll() {
    return await this.prismaService.user.findMany();
  }
}
