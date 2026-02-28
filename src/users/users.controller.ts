import { Body, Controller, Delete, Get, Param, Patch, Query } from '@nestjs/common';
import { UserEntity } from '../database/entities/user.entity';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('deleted')
  findDeleted(
    @Query('limit') limitRaw?: string,
    @Query('offset') offsetRaw?: string,
  ) {
    const limit = limitRaw !== undefined ? Number(limitRaw) : undefined;
    const offset = offsetRaw !== undefined ? Number(offsetRaw) : undefined;
    return this.usersService.findDeleted(limit, offset);
  }

  @Get()
  findAll(
    @Query('limit') limitRaw?: string,
    @Query('offset') offsetRaw?: string,
  ) {
    const limit = limitRaw !== undefined ? Number(limitRaw) : undefined;
    const offset = offsetRaw !== undefined ? Number(offsetRaw) : undefined;
    return this.usersService.findAll(limit, offset);
  }

  @Get(':id/payout-balance')
  getPayoutBalance(@Param('id') id: string) {
    return this.usersService.getPayoutBalance(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: Partial<UserEntity>) {
    return this.usersService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Patch(':id/restore')
  restore(@Param('id') id: string) {
    return this.usersService.restore(id);
  }
}
