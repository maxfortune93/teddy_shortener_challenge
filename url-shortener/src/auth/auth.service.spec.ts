import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma/prisma.service';
import {
  UnprocessableEntityException,
  ConflictException,
} from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import * as bcrypt from 'bcrypt';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

describe('AuthService', () => {
  let authService: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('token-jwt'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        {
          provide: WINSTON_MODULE_NEST_PROVIDER,
          useValue: {
            log: jest.fn(),
            warn: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('register', () => {
    it('deve registrar um novo usuário', async () => {
      const createAuthDto: CreateAuthDto = {
        email: 'usuario@example.com',
        password: 'senha123',
        confirmPassword: 'senha123',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        id: 'user-id',
        email: 'usuario@example.com',
        password: 'hashedpassword',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await authService.register(createAuthDto);

      expect(result).toEqual({
        id: 'user-id',
        email: 'usuario@example.com',
        password: 'hashedpassword',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: createAuthDto.email },
      });
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: createAuthDto.email,
          password: expect.any(String),
        },
      });
    });

    it('deve lançar uma exceção se as senhas não coincidirem', async () => {
      const createAuthDto: CreateAuthDto = {
        email: 'usuario@example.com',
        password: 'senha123',
        confirmPassword: 'senha456',
      };

      await expect(authService.register(createAuthDto)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('deve lançar uma exceção se o email já estiver em uso', async () => {
      const createAuthDto: CreateAuthDto = {
        email: 'usuario@example.com',
        password: 'senha123',
        confirmPassword: 'senha123',
      };

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'existing-user-id',
      });

      await expect(authService.register(createAuthDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    it('deve fazer login do usuário', async () => {
      const loginAuthDto: UpdateAuthDto = {
        email: 'usuario@example.com',
        password: 'senha123',
      };

      const mockUser = {
        id: 'user-id',
        email: 'usuario@example.com',
        password: await bcrypt.hash('senha123', 10),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await authService.login(loginAuthDto);

      expect(result).toEqual({ token: 'token-jwt' });
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginAuthDto.email },
      });
      expect(jwtService.sign).toHaveBeenCalledWith({ userId: mockUser.id });
    });

    it('deve lançar uma exceção se as credenciais forem inválidas', async () => {
      const loginAuthDto: UpdateAuthDto = {
        email: 'usuario@example.com',
        password: 'senha123',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(authService.login(loginAuthDto)).rejects.toThrow(
        'Senha Inválida',
      );
    });
  });

  describe('findOneWithEmail', () => {
    it('deve encontrar um usuário pelo email', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'usuario@example.com',
        password: 'hashedpassword',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await authService.findOneWithEmail('usuario@example.com');

      expect(result).toEqual(mockUser);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'usuario@example.com' },
      });
    });
  });

  describe('findAll', () => {
    it('deve encontrar todos os usuários', async () => {
      const mockUsers = [
        {
          id: 'user-id-1',
          email: 'usuario1@example.com',
          password: 'hashedpassword',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'user-id-2',
          email: 'usuario2@example.com',
          password: 'hashedpassword',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      const result = await authService.findAll();

      expect(result).toEqual(mockUsers);
      expect(prismaService.user.findMany).toHaveBeenCalled();
    });
  });
});
