import { Injectable, NotFoundException } from '@nestjs/common';

import { Url } from '@prisma/client';
import { PrismaService } from '../prisma/prisma/prisma.service';

@Injectable()
export class ShortUrlService {
  private readonly BASE_URL = process.env.BASE_URL;
  constructor(private prismaService: PrismaService) {}

  async shortenUrl(
    originalUrl: string,
    userId?: string,
  ): Promise<Partial<Url>> {
    const shortUrlId = this.generateShortUrlId();
    const shortUrl = `${this.BASE_URL}/${shortUrlId}`;

    const newUrl = await this.prismaService.url.create({
      data: {
        originalUrl,
        shortUrl,
        userId,
      },
    });

    return newUrl;
  }

  async findOriginalUrl(shortUrlId: string): Promise<string> {
    const shortUrl = `${process.env.BASE_URL}/${shortUrlId}`;
    const url = await this.prismaService.url.findFirst({
      where: { shortUrl, deletedAt: null },
    });

    if (!url) {
      throw new NotFoundException('URL encurtada não encontrada');
    }

    await this.prismaService.url.update({
      where: { id: url.id },
      data: { clickCount: { increment: 1 } },
    });

    return url.originalUrl;
  }

  async listUserUrls(userId: string): Promise<Url[]> {
    return this.prismaService.url.findMany({
      where: { userId, deletedAt: null },
    });
  }

  async updateUserUrl(
    userId: string,
    urlId: string,
    newOriginalUrl: string,
  ): Promise<Url> {
    const url = await this.prismaService.url.findFirst({
      where: { id: urlId, userId, deletedAt: null },
    });

    if (!url) {
      throw new NotFoundException(
        'URL não encontrada ou você não tem permissão para atualizá-la.',
      );
    }

    return this.prismaService.url.update({
      where: { id: urlId },
      data: {
        originalUrl: newOriginalUrl,
        updatedAt: new Date(),
      },
    });
  }

  async deleteUserUrl(userId: string, urlId: string): Promise<Url> {
    const url = await this.prismaService.url.findFirst({
      where: { id: urlId, userId, deletedAt: null },
    });

    if (!url) {
      throw new NotFoundException(
        'URL não encontrada ou você não tem permissão para excluí-la.',
      );
    }

    return this.prismaService.url.update({
      where: { id: urlId },
      data: { deletedAt: new Date() },
    });
  }

  private generateShortUrlId(): string {
    return Math.random().toString(36).substring(2, 8);
  }
}
