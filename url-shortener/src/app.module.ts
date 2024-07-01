import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ShortUrlModule } from './short-url/short-url.module';
import { LoggerModule } from './logger/logger.service';

@Module({
  imports: [AuthModule, ShortUrlModule, PrismaModule, LoggerModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
