import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import {
  UnprocessableEntityException,
  ConflictException,
} from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { JwtService } from '@nestjs/jwt';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('token-jwt'),
          },
        },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });

  describe('create', () => {
    it('deve registrar um novo usuário', async () => {
      const createAuthDto: CreateAuthDto = {
        email: 'usuario@example.com',
        password: 'senha123',
        confirmPassword: 'senha123',
      };

      const mockUser = {
        id: 'user-id',
        email: 'usuario@example.com',
        password: 'hashedpassword',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(authService, 'register').mockResolvedValue(mockUser);

      const result = await authController.create(createAuthDto);
      expect(result).toEqual(mockUser);
      expect(authService.register).toHaveBeenCalledWith(createAuthDto);
    });

    it('deve lançar uma exceção se as senhas não coincidirem', async () => {
      const createAuthDto: CreateAuthDto = {
        email: 'usuario@example.com',
        password: 'senha123',
        confirmPassword: 'senha456',
      };

      jest
        .spyOn(authService, 'register')
        .mockRejectedValue(
          new UnprocessableEntityException('As senhas não conferem'),
        );

      await expect(authController.create(createAuthDto)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('deve lançar uma exceção se o email já estiver em uso', async () => {
      const createAuthDto: CreateAuthDto = {
        email: 'usuario@example.com',
        password: 'senha123',
        confirmPassword: 'senha123',
      };

      jest
        .spyOn(authService, 'register')
        .mockRejectedValue(new ConflictException('O email já está em uso'));

      await expect(authController.create(createAuthDto)).rejects.toThrow(
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

      const accessToken = { token: 'token-jwt' };
      jest.spyOn(authService, 'login').mockResolvedValue(accessToken);

      const result = await authController.login(loginAuthDto);
      expect(result).toEqual(accessToken);
      expect(authService.login).toHaveBeenCalledWith(loginAuthDto);
    });

    it('deve lançar uma exceção se as credenciais forem inválidas', async () => {
      const loginAuthDto: UpdateAuthDto = {
        email: 'usuario@example.com',
        password: 'senha123',
      };

      jest
        .spyOn(authService, 'login')
        .mockRejectedValue(
          new UnprocessableEntityException('Credenciais inválidas'),
        );

      await expect(authController.login(loginAuthDto)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });
  });
});
