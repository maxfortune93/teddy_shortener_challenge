import { Test, TestingModule } from '@nestjs/testing';
import { ShortUrlService } from './short-url.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { Url } from '@prisma/client';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

describe('ShortUrlService', () => {
  let shortUrlService: ShortUrlService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    url: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('token-jwt'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShortUrlService,
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

    shortUrlService = module.get<ShortUrlService>(ShortUrlService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(shortUrlService).toBeDefined();
  });

  describe('shortenUrl', () => {
    it('deve encurtar uma URL', async () => {
      const originalUrl = 'https://example.com';
      const mockUrl: Partial<Url> = {
        id: 'url-id',
        originalUrl,
        shortUrl: 'http://localhost:4000/abc123',
        userId: 'user-id',
        clickCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.url.create.mockResolvedValue(mockUrl);

      const result = await shortUrlService.shortenUrl(originalUrl, 'user-id');

      expect(result).toEqual(mockUrl);
      expect(prismaService.url.create).toHaveBeenCalledWith({
        data: {
          originalUrl,
          shortUrl: expect.stringContaining('http://localhost:4000/'),
          userId: 'user-id',
        },
      });
    });
  });

  describe('findOriginalUrl', () => {
    it('deve encontrar a URL original e incrementar o contador de cliques', async () => {
      const shortUrlId = 'abc123';
      const mockUrl: Url = {
        id: 'url-id',
        originalUrl: 'https://example.com',
        shortUrl: 'http://localhost:4000/abc123',
        userId: 'user-id',
        clickCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrismaService.url.findFirst.mockResolvedValue(mockUrl);
      mockPrismaService.url.update.mockResolvedValue(mockUrl);

      const result = await shortUrlService.findOriginalUrl(shortUrlId);

      expect(result).toEqual(mockUrl.originalUrl);
      expect(prismaService.url.findFirst).toHaveBeenCalledWith({
        where: { shortUrl: 'http://localhost:4000/abc123', deletedAt: null },
      });
      expect(prismaService.url.update).toHaveBeenCalledWith({
        where: { id: mockUrl.id },
        data: { clickCount: { increment: 1 } },
      });
    });

    it('deve lançar uma exceção se a URL curta não for encontrada', async () => {
      const shortUrlId = 'abc123';

      mockPrismaService.url.findFirst.mockResolvedValue(null);

      await expect(shortUrlService.findOriginalUrl(shortUrlId)).rejects.toThrow(
        new NotFoundException('URL encurtada não encontrada'),
      );
    });
  });

  describe('listUserUrls', () => {
    it('deve listar URLs encurtadas pelo usuário', async () => {
      const userId = 'user-id';
      const mockUrls: Url[] = [
        {
          id: 'url-id-1',
          originalUrl: 'https://example1.com',
          shortUrl: 'http://localhost:4000/abc123',
          userId,
          clickCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ];

      mockPrismaService.url.findMany.mockResolvedValue(mockUrls);

      const result = await shortUrlService.listUserUrls(userId);

      expect(result).toEqual(mockUrls);
      expect(prismaService.url.findMany).toHaveBeenCalledWith({
        where: { userId, deletedAt: null },
      });
    });
  });

  describe('updateUserUrl', () => {
    it('deve atualizar a URL original de uma URL encurtada', async () => {
      const userId = 'user-id';
      const urlId = 'url-id';
      const newOriginalUrl = 'https://new-example.com';
      const mockUrl: Url = {
        id: urlId,
        originalUrl: newOriginalUrl,
        shortUrl: 'http://localhost:4000/abc123',
        userId,
        clickCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrismaService.url.findFirst.mockResolvedValue(mockUrl);
      mockPrismaService.url.update.mockResolvedValue(mockUrl);

      const result = await shortUrlService.updateUserUrl(
        userId,
        urlId,
        newOriginalUrl,
      );

      expect(result).toEqual(mockUrl);
      expect(prismaService.url.findFirst).toHaveBeenCalledWith({
        where: { id: urlId, userId, deletedAt: null },
      });
      expect(prismaService.url.update).toHaveBeenCalledWith({
        where: { id: urlId },
        data: {
          originalUrl: newOriginalUrl,
          updatedAt: expect.any(Date),
        },
      });
    });

    it('deve lançar uma exceção se a URL não for encontrada ou o usuário não tiver permissão', async () => {
      const userId = 'user-id';
      const urlId = 'url-id';
      const newOriginalUrl = 'https://new-example.com';

      mockPrismaService.url.findFirst.mockResolvedValue(null);

      await expect(
        shortUrlService.updateUserUrl(userId, urlId, newOriginalUrl),
      ).rejects.toThrow(
        new NotFoundException(
          'URL não encontrada ou você não tem permissão para atualizá-la.',
        ),
      );
    });
  });

  describe('deleteUserUrl', () => {
    it('deve excluir logicamente uma URL encurtada', async () => {
      const userId = 'user-id';
      const urlId = 'url-id';
      const mockUrl: Url = {
        id: urlId,
        originalUrl: 'https://example.com',
        shortUrl: 'http://localhost:4000/abc123',
        userId,
        clickCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrismaService.url.findFirst.mockResolvedValue(mockUrl);
      mockPrismaService.url.update.mockResolvedValue({
        ...mockUrl,
        deletedAt: new Date(),
      });

      const result = await shortUrlService.deleteUserUrl(userId, urlId);

      expect(result.deletedAt).not.toBeNull();
      expect(prismaService.url.findFirst).toHaveBeenCalledWith({
        where: { id: urlId, userId, deletedAt: null },
      });
      expect(prismaService.url.update).toHaveBeenCalledWith({
        where: { id: urlId },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('deve lançar uma exceção se a URL não for encontrada ou o usuário não tiver permissão para excluí-la', async () => {
      const userId = 'user-id';
      const urlId = 'url-id';

      mockPrismaService.url.findFirst.mockResolvedValue(null);

      await expect(
        shortUrlService.deleteUserUrl(userId, urlId),
      ).rejects.toThrow(
        new NotFoundException(
          'URL não encontrada ou você não tem permissão para excluí-la.',
        ),
      );
    });
  });
});
