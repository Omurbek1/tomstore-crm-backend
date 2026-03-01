import { Body, Controller, Post } from '@nestjs/common';
import {
  AiService,
  AnalyzePayload,
  MarketingPlanDraftPayload,
  MaterialsHelpPayload,
  OrderDraftPayload,
  TasksDraftPayload,
} from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('analyze')
  analyze(@Body() payload: AnalyzePayload) {
    return this.aiService.analyze(payload);
  }

  @Post('tasks-draft')
  tasksDraft(@Body() payload: TasksDraftPayload) {
    return this.aiService.tasksDraft(payload);
  }

  @Post('marketing-plan-draft')
  marketingPlanDraft(@Body() payload: MarketingPlanDraftPayload) {
    return this.aiService.marketingPlanDraft(payload);
  }

  @Post('materials-help')
  materialsHelp(@Body() payload: MaterialsHelpPayload) {
    return this.aiService.materialsHelp(payload);
  }

  @Post('order-draft')
  orderDraft(@Body() payload: OrderDraftPayload) {
    return this.aiService.orderDraft(payload);
  }
}
