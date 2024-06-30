import {
  ConflictException,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
  ) {}

  private async hashPassword(password: string) {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  async register(registerDto: CreateAuthDto) {
    if (registerDto.password !== registerDto.confirmPassword) {
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
    return user;
  }

  async login(loginDto: UpdateAuthDto) {
    const user = await this.findOneWithEmail(loginDto.email);
    console.log('user', user);
    if (!user || !(await bcrypt.compare(loginDto.password, user.password))) {
      throw new Error('Senha Inválida');
    }

    const token = this.jwtService.sign({ userId: user.id });
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
