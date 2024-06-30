import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (authHeader) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = this.jwtService.verify(token, {
          secret: `${process.env.jwt_secret}`,
        });
        request.user = decoded;
      } catch (error) {
        request.user = null;
      }
    } else {
      request.user = null;
    }

    return true;
  }
}
