import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { InventoryService } from './inventory.service';

type CreateMovementBody = {
  productId: string;
  type: 'in' | 'out' | 'adjustment';
  operationType?:
    | 'sale'
    | 'purchase'
    | 'writeoff'
    | 'return_in'
    | 'return_out'
    | 'transfer_in'
    | 'transfer_out'
    | 'adjustment'
    | 'manual_in'
    | 'manual_out'
    | 'other';
  quantity: number;
  branchName?: string;
  reason?: string;
  actorId?: string;
  actorName?: string;
};

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('products')
  findProductStock(
    @Query('q') q?: string,
    @Query('branchName') branchName?: string,
    @Query('limit') limitRaw?: string,
    @Query('offset') offsetRaw?: string,
  ) {
    const limit = limitRaw !== undefined ? Number(limitRaw) : undefined;
    const offset = offsetRaw !== undefined ? Number(offsetRaw) : undefined;
    return this.inventoryService.findProductStock(q, branchName, limit, offset);
  }

  @Get('movements')
  findMovements(
    @Query('productId') productId?: string,
    @Query('branchName') branchName?: string,
    @Query('limit') limitRaw?: string,
    @Query('offset') offsetRaw?: string,
  ) {
    const limit = limitRaw !== undefined ? Number(limitRaw) : undefined;
    const offset = offsetRaw !== undefined ? Number(offsetRaw) : undefined;
    return this.inventoryService.findMovements(productId, branchName, limit, offset);
  }

  @Post('movements')
  createMovement(@Body() body: CreateMovementBody) {
    return this.inventoryService.createMovement(body);
  }
}
