import {
  Controller,
  Get,
  Post,
  Body,
  // Patch,
  Param,
  Delete,
  Put,
  Request,
  UseGuards,
  Res,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ShortUrlService } from './short-url.service';
import { CreateShortUrlDto } from './dto/create-short-url.dto';
import { UpdateShortUrlDto } from './dto/update-short-url.dto';
import { OptionalAuthGuard } from '../auth/guards/optional-auth-guard';
import { JwtGuard } from '../auth/guards/jwt-guard';
import { Response } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Short URL')
@Controller()
export class ShortUrlController {
  constructor(private readonly shortUrlService: ShortUrlService) {}

  @UseGuards(OptionalAuthGuard)
  @Post('shorten')
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ summary: 'Encurtar uma URL' })
  @ApiResponse({ status: 201, description: 'URL encurtada com sucesso' })
  async shortenUrl(
    @Body() createShortUrlDto: CreateShortUrlDto,
    @Request() req,
  ): Promise<any> {
    const url = await this.shortUrlService.shortenUrl(
      createShortUrlDto.originalUrl,
      req.user?.userId,
    );
    return { message: 'URL encurtada com sucesso', shortUrl: url.shortUrl };
  }

  @Get(':shortUrlId')
  @ApiOperation({ summary: 'Redirecionar para a URL original' })
  @ApiResponse({
    status: 200,
    description: 'Redirecionado para a URL original',
  })
  async redirectToOriginal(
    @Param('shortUrlId') shortUrlId: string,
    @Res() res: Response,
  ): Promise<any> {
    const originalUrl = await this.shortUrlService.findOriginalUrl(shortUrlId);
    res.redirect(originalUrl);
  }

  @UseGuards(JwtGuard)
  @Get('user/urls')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar URLs encurtadas pelo usuário' })
  @ApiResponse({ status: 200, description: 'Listagem de URLs encurtadas' })
  async listUserUrls(@Request() req): Promise<any> {
    const urls = await this.shortUrlService.listUserUrls(req.user.userId);
    return { urls };
  }

  @UseGuards(JwtGuard)
  @Put('user/urls/:urlId')
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar uma URL encurtada' })
  @ApiResponse({ status: 200, description: 'URL atualizada com sucesso' })
  async updateUserUrl(
    @Param('urlId') urlId: string,
    @Body() updateShortUrlDto: UpdateShortUrlDto,
    @Request() req,
  ): Promise<any> {
    const url = await this.shortUrlService.updateUserUrl(
      req.user.userId,
      urlId,
      updateShortUrlDto.newOriginalUrl,
    );
    return { message: 'URL atualizada com sucesso', url };
  }

  @UseGuards(JwtGuard)
  @Delete('user/urls/:urlId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Excluir uma URL encurtada' })
  @ApiResponse({ status: 200, description: 'URL excluída com sucesso' })
  async deleteUserUrl(
    @Param('urlId') urlId: string,
    @Request() req,
  ): Promise<any> {
    const url = await this.shortUrlService.deleteUserUrl(
      req.user.userId,
      urlId,
    );
    return { message: 'URL excluída com sucesso', url };
  }
}
