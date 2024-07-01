import {
  Inject,
  Injectable,
  LoggerService,
  NotFoundException,
} from '@nestjs/common';

import { Url } from '@prisma/client';
import { PrismaService } from '../prisma/prisma/prisma.service';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

@Injectable()
export class ShortUrlService {
  private readonly BASE_URL = process.env.BASE_URL;
  constructor(
    private prismaService: PrismaService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  async shortenUrl(
    originalUrl: string,
    userId?: string,
  ): Promise<Partial<Url>> {
    this.logger.log(`Shortening URL: ${originalUrl} for user: ${userId}`);
    const shortUrlId = this.generateShortUrlId();
    const shortUrl = `${this.BASE_URL}/${shortUrlId}`;

    const newUrl = await this.prismaService.url.create({
      data: {
        originalUrl,
        shortUrl,
        userId,
      },
    });

    this.logger.log(`URL shortened successfully: ${shortUrl}`);
    return newUrl;
  }

  async findOriginalUrl(shortUrlId: string): Promise<string> {
    this.logger.log(`Finding original URL for short URL: ${shortUrlId}`);
    const shortUrl = `${process.env.BASE_URL}/${shortUrlId}`;
    const url = await this.prismaService.url.findFirst({
      where: { shortUrl, deletedAt: null },
    });

    if (!url) {
      this.logger.warn(`Short URL not found`);
      throw new NotFoundException('URL encurtada não encontrada');
    }

    await this.prismaService.url.update({
      where: { id: url.id },
      data: { clickCount: { increment: 1 } },
    });

    this.logger.log(`Original URL found: ${url.originalUrl}`);
    return url.originalUrl;
  }

  async listUserUrls(userId: string): Promise<Url[]> {
    this.logger.log(`Listing URLs for user: ${userId}`);
    return this.prismaService.url.findMany({
      where: { userId, deletedAt: null },
    });
  }

  async updateUserUrl(
    userId: string,
    urlId: string,
    newOriginalUrl: string,
  ): Promise<Url> {
    this.logger.log(`Updating URL: ${urlId} for user: ${userId}`);
    const url = await this.prismaService.url.findFirst({
      where: { id: urlId, userId, deletedAt: null },
    });

    if (!url) {
      this.logger.warn(
        `URL not found or unauthorized update attempt: ${urlId}`,
      );
      throw new NotFoundException(
        'URL não encontrada ou você não tem permissão para atualizá-la.',
      );
    }

    const updatedUrl = await this.prismaService.url.update({
      where: { id: urlId },
      data: {
        originalUrl: newOriginalUrl,
        updatedAt: new Date(),
      },
    });

    this.logger.log(`URL updated successfully: ${updatedUrl.shortUrl}`);
    return updatedUrl;
  }

  async deleteUserUrl(userId: string, urlId: string): Promise<Url> {
    this.logger.log(`Deleting URL: ${urlId} for user: ${userId}`);
    const url = await this.prismaService.url.findFirst({
      where: { id: urlId, userId, deletedAt: null },
    });

    if (!url) {
      this.logger.warn(
        `URL not found or unauthorized delete attempt: ${urlId}`,
      );
      throw new NotFoundException(
        'URL não encontrada ou você não tem permissão para excluí-la.',
      );
    }

    const deletedUrl = await this.prismaService.url.update({
      where: { id: urlId },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`URL deleted successfully: ${deletedUrl.shortUrl}`);
    return deletedUrl;
  }

  private generateShortUrlId(): string {
    return Math.random().toString(36).substring(2, 8);
  }
}
