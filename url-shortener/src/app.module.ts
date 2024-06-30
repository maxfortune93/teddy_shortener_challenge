import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ShortUrlModule } from './short-url/short-url.module';

@Module({
  imports: [AuthModule, ShortUrlModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
