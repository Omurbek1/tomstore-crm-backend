import { Body, Controller, Post } from '@nestjs/common';
import { UserEntity } from '../database/entities/user.entity';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() body: { name: string; password: string }) {
    return this.authService.login(body.name, body.password);
  }

  @Post('register')
  register(@Body() body: Partial<UserEntity>) {
    return this.authService.register(body);
  }
}
