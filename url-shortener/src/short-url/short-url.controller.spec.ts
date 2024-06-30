import { Test, TestingModule } from '@nestjs/testing';
import { ShortUrlController } from './short-url.controller';
import { ShortUrlService } from './short-url.service';
import { CreateShortUrlDto } from './dto/create-short-url.dto';
import { UpdateShortUrlDto } from './dto/update-short-url.dto';
import { NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { JwtService } from '@nestjs/jwt';

describe('ShortUrlController', () => {
  let shortUrlController: ShortUrlController;
  let shortUrlService: ShortUrlService;

  const mockShortUrlService = {
    shortenUrl: jest.fn(),
    findOriginalUrl: jest.fn(),
    listUserUrls: jest.fn(),
    updateUserUrl: jest.fn(),
    deleteUserUrl: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShortUrlController],
      providers: [
        { provide: ShortUrlService, useValue: mockShortUrlService },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('token-jwt'),
          },
        },
      ],
    }).compile();

    shortUrlController = module.get<ShortUrlController>(ShortUrlController);
    shortUrlService = module.get<ShortUrlService>(ShortUrlService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(shortUrlController).toBeDefined();
  });

  describe('shortenUrl', () => {
    it('deve encurtar uma URL', async () => {
      const createShortUrlDto: CreateShortUrlDto = {
        originalUrl: 'https://example.com',
      };

      const mockUrl = {
        shortUrl: 'http://localhost:3000/abc123',
      };

      mockShortUrlService.shortenUrl.mockResolvedValue(mockUrl);

      const req = { user: { userId: 'user-id' } };
      const result = await shortUrlController.shortenUrl(
        createShortUrlDto,
        req as any,
      );

      expect(result).toEqual({
        message: 'URL encurtada com sucesso',
        shortUrl: mockUrl.shortUrl,
      });
      expect(shortUrlService.shortenUrl).toHaveBeenCalledWith(
        'https://example.com',
        'user-id',
      );
    });
  });

  describe('redirectToOriginal', () => {
    it('deve redirecionar para a URL original', async () => {
      const res = { redirect: jest.fn() } as unknown as Response;
      const shortUrlId = 'abc123';
      const originalUrl = 'https://example.com';

      mockShortUrlService.findOriginalUrl.mockResolvedValue(originalUrl);

      await shortUrlController.redirectToOriginal(shortUrlId, res);

      expect(shortUrlService.findOriginalUrl).toHaveBeenCalledWith(shortUrlId);
      expect(res.redirect).toHaveBeenCalledWith(originalUrl);
    });

    it('deve lançar uma exceção se a URL curta não for encontrada', async () => {
      const res = { redirect: jest.fn() } as unknown as Response;
      const shortUrlId = 'abc123';

      jest
        .spyOn(shortUrlService, 'findOriginalUrl')
        .mockRejectedValue(
          new NotFoundException('URL encurtada não encontrada'),
        );

      await expect(
        shortUrlController.redirectToOriginal(shortUrlId, res),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('listUserUrls', () => {
    it('deve listar URLs encurtadas pelo usuário', async () => {
      const req = { user: { userId: 'user-id' } };
      const mockUrls = [
        {
          id: 'url-id-1',
          originalUrl: 'https://example1.com',
          shortUrl: 'abc123',
        },
      ];

      mockShortUrlService.listUserUrls.mockResolvedValue(mockUrls);

      const result = await shortUrlController.listUserUrls(req as any);

      expect(result).toEqual({ urls: mockUrls });
      expect(shortUrlService.listUserUrls).toHaveBeenCalledWith('user-id');
    });
  });

  describe('updateUserUrl', () => {
    it('deve atualizar uma URL encurtada', async () => {
      const updateShortUrlDto: UpdateShortUrlDto = {
        newOriginalUrl: 'https://new-example.com',
      };

      const req = { user: { userId: 'user-id' } };
      const mockUrl = {
        id: 'url-id',
        originalUrl: 'https://new-example.com',
        shortUrl: 'abc123',
      };

      mockShortUrlService.updateUserUrl.mockResolvedValue(mockUrl);

      const result = await shortUrlController.updateUserUrl(
        'url-id',
        updateShortUrlDto,
        req as any,
      );

      expect(result).toEqual({
        message: 'URL atualizada com sucesso',
        url: mockUrl,
      });
      expect(shortUrlService.updateUserUrl).toHaveBeenCalledWith(
        'user-id',
        'url-id',
        'https://new-example.com',
      );
    });
  });

  describe('deleteUserUrl', () => {
    it('deve excluir uma URL encurtada', async () => {
      const req = { user: { userId: 'user-id' } };
      const mockUrl = {
        id: 'url-id',
        originalUrl: 'https://example.com',
        shortUrl: 'abc123',
      };

      mockShortUrlService.deleteUserUrl.mockResolvedValue(mockUrl);

      const result = await shortUrlController.deleteUserUrl(
        'url-id',
        req as any,
      );

      expect(result).toEqual({
        message: 'URL excluída com sucesso',
        url: mockUrl,
      });
      expect(shortUrlService.deleteUserUrl).toHaveBeenCalledWith(
        'user-id',
        'url-id',
      );
    });
  });
});
