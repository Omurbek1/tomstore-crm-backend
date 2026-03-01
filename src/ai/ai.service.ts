import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiMemoryEntity } from '../database/entities/ai-memory.entity';

type Domain = 'sales' | 'marketing';

export type AnalyzePayload = {
  domain: Domain;
  locale?: string;
  metrics?: Record<string, unknown>;
};

export type TasksDraftPayload = {
  text: string;
  locale?: string;
  assignees?: Array<{ id: string; name: string; role?: string }>;
};

export type MarketingPlanDraftPayload = {
  text: string;
  locale?: string;
  month?: string;
  assignees?: Array<{ id: string; name: string; role?: string }>;
};

export type MaterialsHelpPayload = {
  question: string;
  locale?: string;
  audience?: 'manager' | 'marketing' | 'smm' | 'general';
  history?: Array<{
    question?: string;
    answer?: string;
    createdAt?: string;
  }>;
  materials?: Array<{
    id?: string;
    title?: string;
    description?: string;
    type?: string;
    url?: string;
    folderName?: string;
  }>;
};

export type OrderDraftPayload = {
  text: string;
  locale?: string;
  branches?: string[];
  products?: Array<{ id?: string; name?: string; price?: number }>;
  managers?: Array<{ id?: string; name?: string; role?: string }>;
  manualPaymentTypes?: string[];
};

type AnalyzeResult = {
  source: 'llm' | 'rule-based';
  summary: string;
  risks: string[];
  opportunities: string[];
  recommendations: string[];
};

type TaskDraftItem = {
  title: string;
  description?: string;
  assigneeId?: string;
  assigneeName?: string;
  assigneeRole?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  deadline?: string | null;
};

type MarketingPlanDraft = {
  managerId?: string;
  managerName?: string;
  managerRole?: string;
  month: string;
  planMode: 'week' | 'month';
  periodStart?: string | null;
  periodEnd?: string | null;
  plannedPosts: number;
  plannedReels: number;
  publishedPosts: number;
  publishedReels: number;
  reach: number;
  engagements: number;
  followersGrowth: number;
  salaryBase: number;
  note?: string;
  planItems: Array<{
    id: string;
    date: string;
    type: 'post' | 'reels' | 'story' | 'other';
    title?: string;
    done: boolean;
  }>;
};

type MaterialsHelpResult = {
  source: 'llm';
  answer: string;
  recommendedMaterials: Array<{
    id?: string;
    title: string;
    reason?: string;
    url?: string;
  }>;
};

type OrderDraftResult = {
  source: 'llm';
  draft: {
    clientName?: string;
    clientPhone?: string;
    clientAddress?: string;
    branchName?: string;
    productName?: string;
    quantity?: number;
    price?: number;
    saleType?: 'office' | 'delivery';
    paymentType?: 'cash' | 'installment' | 'hybrid' | 'booking' | 'manual';
    paymentLabel?: string;
    installmentMonths?: number;
    deliveryCost?: number;
    clientPaysDelivery?: boolean;
    bookingDeposit?: number;
    bookingBuyout?: number;
    managerName?: string;
    comment?: string;
  };
};

@Injectable()
export class AiService {
  constructor(
    @InjectRepository(AiMemoryEntity)
    private readonly aiMemoriesRepo: Repository<AiMemoryEntity>,
  ) {}

  async analyze(payload: AnalyzePayload): Promise<AnalyzeResult> {
    const normalized: AnalyzePayload = {
      domain: payload?.domain === 'marketing' ? 'marketing' : 'sales',
      locale: String(payload?.locale || 'ru'),
      metrics:
        payload && payload.metrics && typeof payload.metrics === 'object'
          ? payload.metrics
          : {},
    };

    if (!process.env.AI_API_KEY || process.env.AI_PROVIDER === 'disabled') {
      throw new ServiceUnavailableException(
        'ИИ не настроен: укажите AI_API_KEY на сервере',
      );
    }

    const llmResult = await this.callLlm(normalized);
    if (!llmResult) {
      throw new ServiceUnavailableException(
        'ИИ временно недоступен, попробуйте позже',
      );
    }

    await this.saveMemory({
      domain: normalized.domain,
      audience: normalized.domain,
      question: `Анализ метрик: ${JSON.stringify(normalized.metrics || {})}`,
      answer: JSON.stringify(llmResult),
      metadata: { type: 'analyze' },
    });

    return llmResult;
  }

  private async callLlm(payload: AnalyzePayload): Promise<AnalyzeResult | null> {
    const providerUrl =
      process.env.AI_BASE_URL?.trim() || 'https://api.openai.com/v1';
    const model = process.env.AI_MODEL?.trim() || 'gpt-4.1-mini';
    const apiKey = process.env.AI_API_KEY?.trim();
    if (!apiKey) return null;

    const memoryContext = await this.getMemoryContext({
      domain: payload.domain,
      audience: payload.domain,
      queryText: JSON.stringify(payload.metrics || {}),
    });

    const systemPrompt =
      payload.domain === 'sales'
        ? 'Ты senior CRO/Head of Sales. Верни короткий профессиональный анализ на русском.'
        : 'Ты senior CMO/SMM lead. Верни короткий профессиональный анализ на русском.';

    const userPrompt = `Сформируй JSON:
{
  "summary": "1-2 предложения",
  "risks": ["..."],
  "opportunities": ["..."],
  "recommendations": ["..."]
}
Только валидный JSON.
Похожие прошлые кейсы:
${memoryContext || 'нет'}
Данные: ${JSON.stringify(payload.metrics || {})}`;

    const res = await fetch(`${providerUrl.replace(/\/+$/, '')}/responses`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        input: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2,
      }),
    });

    if (!res.ok) return null;
    const data = (await res.json()) as {
      output_text?: string;
      output?: Array<{
        content?: Array<{ type?: string; text?: string }>;
      }>;
    };

    const text =
      data.output_text ||
      data.output?.flatMap((x) => x.content || []).find((c) => c.type === 'output_text')
        ?.text ||
      '';
    const parsed = this.safeParseAiJson(text);
    if (!parsed) return null;

    return {
      source: 'llm',
      summary: parsed.summary,
      risks: parsed.risks,
      opportunities: parsed.opportunities,
      recommendations: parsed.recommendations,
    };
  }

  async tasksDraft(payload: TasksDraftPayload): Promise<{
    source: 'llm';
    tasks: TaskDraftItem[];
  }> {
    const text = String(payload?.text || '').trim();
    if (!text) {
      throw new ServiceUnavailableException('Текст для генерации задач пустой');
    }
    if (!process.env.AI_API_KEY || process.env.AI_PROVIDER === 'disabled') {
      throw new ServiceUnavailableException(
        'ИИ не настроен: укажите AI_API_KEY на сервере',
      );
    }

    const providerUrl =
      process.env.AI_BASE_URL?.trim() || 'https://api.openai.com/v1';
    const model = process.env.AI_MODEL?.trim() || 'gpt-4.1-mini';
    const apiKey = process.env.AI_API_KEY?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'ИИ не настроен: укажите AI_API_KEY на сервере',
      );
    }

    const assignees = Array.isArray(payload.assignees) ? payload.assignees : [];
    const assigneeMap = new Map(assignees.map((x) => [x.id, x]));
    const memoryContext = await this.getMemoryContext({
      domain: 'tasks',
      audience: 'general',
      queryText: text,
    });

    const systemPrompt =
      'Ты project manager. Создай профессиональный список задач из текста. Верни только JSON.';
    const userPrompt = `Сформируй JSON:
{
  "tasks": [
    {
      "title": "краткий заголовок",
      "description": "детали",
      "assigneeId": "id из списка ниже или пусто",
      "assigneeName": "имя исполнителя, если нет id",
      "assigneeRole": "роль",
      "priority": "low|medium|high|urgent",
      "deadline": "YYYY-MM-DD или null"
    }
  ]
}
Ограничение: максимум 12 задач.
Список доступных исполнителей:
${JSON.stringify(assignees)}
Текст:
${text}
Похожие кейсы:
${memoryContext || 'нет'}`;

    const res = await fetch(`${providerUrl.replace(/\/+$/, '')}/responses`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        input: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2,
      }),
    });

    if (!res.ok) {
      throw new ServiceUnavailableException('ИИ временно недоступен, попробуйте позже');
    }

    const data = (await res.json()) as {
      output_text?: string;
      output?: Array<{
        content?: Array<{ type?: string; text?: string }>;
      }>;
    };
    const textOut =
      data.output_text ||
      data.output?.flatMap((x) => x.content || []).find((c) => c.type === 'output_text')
        ?.text ||
      '';

    const parsed = this.safeParseTasksJson(textOut);
    if (!parsed) {
      throw new ServiceUnavailableException(
        'ИИ вернул некорректный формат задач, попробуйте переформулировать текст',
      );
    }

    const tasks = parsed.tasks
      .slice(0, 12)
      .map((item): TaskDraftItem | null => {
        const title = String(item.title || '').trim();
        if (!title) return null;
        const priority = this.normalizePriority(item.priority);
        const matched = item.assigneeId ? assigneeMap.get(String(item.assigneeId)) : null;
        return {
          title,
          description: String(item.description || '').trim() || undefined,
          assigneeId: matched?.id,
          assigneeName: matched?.name || String(item.assigneeName || '').trim() || undefined,
          assigneeRole: matched?.role || String(item.assigneeRole || '').trim() || undefined,
          priority,
          deadline: this.normalizeDate(item.deadline),
        };
      })
      .filter((x): x is TaskDraftItem => Boolean(x));

    const result = { source: 'llm' as const, tasks };
    await this.saveMemory({
      domain: 'tasks',
      audience: 'general',
      question: text,
      answer: JSON.stringify(result),
      metadata: { type: 'tasks-draft', tasksCount: tasks.length },
    });

    return result;
  }

  async marketingPlanDraft(payload: MarketingPlanDraftPayload): Promise<{
    source: 'llm';
    draft: MarketingPlanDraft;
  }> {
    const text = String(payload?.text || '').trim();
    if (!text) {
      throw new ServiceUnavailableException('Текст плана пустой');
    }
    if (!process.env.AI_API_KEY || process.env.AI_PROVIDER === 'disabled') {
      throw new ServiceUnavailableException(
        'ИИ не настроен: укажите AI_API_KEY на сервере',
      );
    }

    const providerUrl =
      process.env.AI_BASE_URL?.trim() || 'https://api.openai.com/v1';
    const model = process.env.AI_MODEL?.trim() || 'gpt-4.1-mini';
    const apiKey = process.env.AI_API_KEY?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'ИИ не настроен: укажите AI_API_KEY на сервере',
      );
    }

    const month = this.normalizeMonth(payload?.month);
    const assignees = Array.isArray(payload.assignees) ? payload.assignees : [];
    const assigneeMap = new Map(assignees.map((x) => [x.id, x]));
    const memoryContext = await this.getMemoryContext({
      domain: 'marketing',
      audience: 'marketing',
      queryText: text,
    });

    const systemPrompt =
      'Ты senior SMM/Marketing lead. Разбери текстовый контент-план и верни строго JSON.';
    const userPrompt = `Сформируй JSON:
{
  "managerId": "id из списка или пусто",
  "managerName": "имя исполнителя",
  "managerRole": "smm|marketing|...",
  "month": "YYYY-MM",
  "planMode": "week|month",
  "periodStart": "YYYY-MM-DD или null",
  "periodEnd": "YYYY-MM-DD или null",
  "plannedPosts": 0,
  "plannedReels": 0,
  "salaryBase": 0,
  "note": "краткое резюме",
  "planItems": [
    { "id":"1", "date":"YYYY-MM-DD", "type":"post|reels|story|other", "title":"...", "done": false }
  ]
}
Правила:
- publishedPosts/publishedReels/reach/engagements/followersGrowth = 0.
- максимум 31 пункта planItems.
- month = ${month}
Список исполнителей:
${JSON.stringify(assignees)}
Текст:
${text}
Похожие кейсы:
${memoryContext || 'нет'}`;

    const res = await fetch(`${providerUrl.replace(/\/+$/, '')}/responses`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        input: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2,
      }),
    });

    if (!res.ok) {
      throw new ServiceUnavailableException('ИИ временно недоступен, попробуйте позже');
    }

    const data = (await res.json()) as {
      output_text?: string;
      output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
    };
    const textOut =
      data.output_text ||
      data.output?.flatMap((x) => x.content || []).find((c) => c.type === 'output_text')
        ?.text ||
      '';
    const parsed = this.safeParseMarketingDraftJson(textOut);
    if (!parsed) {
      throw new ServiceUnavailableException(
        'ИИ вернул некорректный формат плана, уточните текст',
      );
    }

    const managerIdRaw = String(parsed.managerId || '').trim();
    const matched = managerIdRaw ? assigneeMap.get(managerIdRaw) : null;
    const planMode: 'week' | 'month' =
      parsed.planMode === 'week' ? 'week' : 'month';
    const periodStart = this.normalizeDateString(parsed.periodStart);
    const periodEnd = this.normalizeDateString(parsed.periodEnd);

    const planItems = (Array.isArray(parsed.planItems) ? parsed.planItems : [])
      .slice(0, 31)
      .map((x, idx) => ({
        id: String(x.id || `item-${idx + 1}`),
        date: this.normalizeDateString(x.date) || `${month}-01`,
        type: this.normalizePlanItemType(x.type),
        title: String(x.title || '').trim() || undefined,
        done: Boolean(x.done),
      }));

    const result = {
      source: 'llm' as const,
      draft: {
        managerId: matched?.id,
        managerName: matched?.name || String(parsed.managerName || '').trim() || undefined,
        managerRole: matched?.role || String(parsed.managerRole || '').trim() || undefined,
        month,
        planMode,
        periodStart: planMode === 'week' ? periodStart : null,
        periodEnd: planMode === 'week' ? periodEnd : null,
        plannedPosts: this.toSafeInt(parsed.plannedPosts),
        plannedReels: this.toSafeInt(parsed.plannedReels),
        publishedPosts: 0,
        publishedReels: 0,
        reach: 0,
        engagements: 0,
        followersGrowth: 0,
        salaryBase: this.toSafeInt(parsed.salaryBase),
        note: String(parsed.note || '').trim() || undefined,
        planItems,
      },
    };
    await this.saveMemory({
      domain: 'marketing',
      audience: 'marketing',
      question: text,
      answer: JSON.stringify(result),
      metadata: { type: 'marketing-plan-draft', month },
    });

    return result;
  }

  async materialsHelp(payload: MaterialsHelpPayload): Promise<MaterialsHelpResult> {
    const question = String(payload?.question || '').trim();
    if (!question) {
      throw new ServiceUnavailableException('Вопрос пустой');
    }
    if (!process.env.AI_API_KEY || process.env.AI_PROVIDER === 'disabled') {
      throw new ServiceUnavailableException(
        'ИИ не настроен: укажите AI_API_KEY на сервере',
      );
    }

    const providerUrl =
      process.env.AI_BASE_URL?.trim() || 'https://api.openai.com/v1';
    const model = process.env.AI_MODEL?.trim() || 'gpt-4.1-mini';
    const apiKey = process.env.AI_API_KEY?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'ИИ не настроен: укажите AI_API_KEY на сервере',
      );
    }

    const audience = String(payload.audience || 'general').trim();
    const materials = Array.isArray(payload.materials) ? payload.materials.slice(0, 80) : [];
    const history = Array.isArray(payload.history) ? payload.history.slice(-8) : [];
    const memoryContext = await this.getMemoryContext({
      domain: 'materials',
      audience,
      queryText: question,
    });
    const systemPrompt =
      'Ты корпоративный помощник по базе знаний. Отвечай профессионально и кратко. Если материалов недостаточно, дай практический ответ на основе общей экспертной базы и явно отметь, что это общий совет.';
    const userPrompt = `Сформируй JSON:
{
  "answer": "короткий практический ответ (если нет данных в материалах — общий совет с пометкой)",
  "recommendedMaterials": [
    { "id": "id или пусто", "title": "название", "reason": "почему важно", "url": "ссылка или пусто" }
  ]
}
Правила:
- Если данных в материалах мало/нет: дай полноценный ответ по best-practice, и в начале ответа добавь: "Общий совет (в базе материалов пока нет точного ответа): ...".
- Рекомендуй максимум 5 материалов.
- Аудитория: ${audience}
- Предыдущий диалог (для памяти):
${JSON.stringify(history)}
- Похожие сохранённые кейсы (векторная память):
${memoryContext || 'нет'}
- Вопрос: ${question}
- Материалы:
${JSON.stringify(materials)}`;

    const res = await fetch(`${providerUrl.replace(/\/+$/, '')}/responses`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        input: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2,
      }),
    });

    if (!res.ok) {
      throw new ServiceUnavailableException('ИИ временно недоступен, попробуйте позже');
    }

    const data = (await res.json()) as {
      output_text?: string;
      output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
    };
    const textOut =
      data.output_text ||
      data.output?.flatMap((x) => x.content || []).find((c) => c.type === 'output_text')
        ?.text ||
      '';
    const parsed = this.safeParseMaterialsHelpJson(textOut);
    if (!parsed) {
      throw new ServiceUnavailableException(
        'ИИ вернул некорректный формат ответа, попробуйте переформулировать вопрос',
      );
    }

    const result = {
      source: 'llm' as const,
      answer: String(parsed.answer || '').trim() || 'Ответ не сформирован.',
      recommendedMaterials: (parsed.recommendedMaterials || [])
        .slice(0, 5)
        .map((x) => ({
          id: String(x.id || '').trim() || undefined,
          title: String(x.title || '').trim() || 'Материал',
          reason: String(x.reason || '').trim() || undefined,
          url: String(x.url || '').trim() || undefined,
        })),
    };
    await this.saveMemory({
      domain: 'materials',
      audience,
      question,
      answer: result.answer,
      metadata: {
        type: 'materials-help',
        recommendedTitles: result.recommendedMaterials.map((x) => x.title),
      },
    });

    return result;
  }

  async orderDraft(payload: OrderDraftPayload): Promise<OrderDraftResult> {
    const text = String(payload?.text || '').trim();
    if (!text) {
      throw new ServiceUnavailableException('Текст заказа пустой');
    }
    if (!process.env.AI_API_KEY || process.env.AI_PROVIDER === 'disabled') {
      throw new ServiceUnavailableException(
        'ИИ не настроен: укажите AI_API_KEY на сервере',
      );
    }

    const providerUrl =
      process.env.AI_BASE_URL?.trim() || 'https://api.openai.com/v1';
    const model = process.env.AI_MODEL?.trim() || 'gpt-4.1-mini';
    const apiKey = process.env.AI_API_KEY?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'ИИ не настроен: укажите AI_API_KEY на сервере',
      );
    }

    const branches = Array.isArray(payload?.branches) ? payload.branches.slice(0, 120) : [];
    const products = Array.isArray(payload?.products) ? payload.products.slice(0, 300) : [];
    const managers = Array.isArray(payload?.managers) ? payload.managers.slice(0, 120) : [];
    const manualPaymentTypes = Array.isArray(payload?.manualPaymentTypes)
      ? payload.manualPaymentTypes.slice(0, 40)
      : [];

    const memoryContext = await this.getMemoryContext({
      domain: 'sales-order',
      audience: 'sales',
      queryText: text,
    });

    const systemPrompt =
      'Ты senior sales operator. Преобразуй свободный текст в черновик заказа CRM. Верни только JSON.';
    const userPrompt = `Сформируй JSON:
{
  "clientName": "имя клиента или пусто",
  "clientPhone": "телефон или пусто",
  "clientAddress": "адрес или пусто",
  "branchName": "точное имя филиала из списка или пусто",
  "productName": "точное имя товара из списка или пусто",
  "quantity": 1,
  "price": 0,
  "saleType": "office|delivery",
  "paymentType": "cash|installment|hybrid|booking|manual",
  "paymentLabel": "канал оплаты или провайдер рассрочки",
  "installmentMonths": 0,
  "deliveryCost": 0,
  "clientPaysDelivery": false,
  "bookingDeposit": 0,
  "bookingBuyout": 0,
  "managerName": "имя менеджера из списка или пусто",
  "comment": "краткий комментарий"
}
Правила:
- Только JSON, без пояснений.
- quantity >= 1.
- Если есть доставка клиентом, clientPaysDelivery=true.
- saleType=delivery только когда явно есть доставка/адрес.
- paymentType=manual только если paymentLabel из manualPaymentTypes.
- Если не уверен, оставляй поле пустым/0.
Доступные филиалы:
${JSON.stringify(branches)}
Доступные товары:
${JSON.stringify(products)}
Доступные менеджеры:
${JSON.stringify(managers)}
Доступные ручные типы оплаты:
${JSON.stringify(manualPaymentTypes)}
Текст заказа:
${text}
Похожие кейсы:
${memoryContext || 'нет'}`;

    const res = await fetch(`${providerUrl.replace(/\/+$/, '')}/responses`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        input: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.1,
      }),
    });

    if (!res.ok) {
      throw new ServiceUnavailableException('ИИ временно недоступен, попробуйте позже');
    }

    const data = (await res.json()) as {
      output_text?: string;
      output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
    };
    const textOut =
      data.output_text ||
      data.output?.flatMap((x) => x.content || []).find((c) => c.type === 'output_text')
        ?.text ||
      '';
    const parsed = this.safeParseOrderDraftJson(textOut);
    if (!parsed) {
      throw new ServiceUnavailableException(
        'ИИ вернул некорректный формат черновика заказа, уточните текст',
      );
    }

    const normalizeNameFromList = (value: string | undefined, list: string[]) => {
      const raw = String(value || '').trim();
      if (!raw) return undefined;
      const exact = list.find((x) => x.toLowerCase() === raw.toLowerCase());
      return exact || raw;
    };

    const normalizedPaymentType = this.normalizePaymentType(parsed.paymentType);
    const paymentLabel = String(parsed.paymentLabel || '').trim() || undefined;
    const manualAllowed =
      normalizedPaymentType !== 'manual' ||
      (paymentLabel &&
        manualPaymentTypes.some((x) => x.toLowerCase() === paymentLabel.toLowerCase()));

    const result: OrderDraftResult = {
      source: 'llm',
      draft: {
        clientName: String(parsed.clientName || '').trim() || undefined,
        clientPhone: String(parsed.clientPhone || '').trim() || undefined,
        clientAddress: String(parsed.clientAddress || '').trim() || undefined,
        branchName: normalizeNameFromList(parsed.branchName, branches),
        productName: normalizeNameFromList(
          parsed.productName,
          products.map((p) => String(p.name || '')).filter(Boolean),
        ),
        quantity: Math.max(1, this.toSafeInt(parsed.quantity || 1)),
        price: this.toSafeInt(parsed.price || 0),
        saleType: parsed.saleType === 'delivery' ? 'delivery' : 'office',
        paymentType:
          normalizedPaymentType === 'manual' && !manualAllowed
            ? 'cash'
            : normalizedPaymentType,
        paymentLabel:
          normalizedPaymentType === 'manual' && !manualAllowed
            ? undefined
            : paymentLabel,
        installmentMonths: this.toSafeInt(parsed.installmentMonths || 0),
        deliveryCost: this.toSafeInt(parsed.deliveryCost || 0),
        clientPaysDelivery: Boolean(parsed.clientPaysDelivery),
        bookingDeposit: this.toSafeInt(parsed.bookingDeposit || 0),
        bookingBuyout: this.toSafeInt(parsed.bookingBuyout || 0),
        managerName: normalizeNameFromList(
          parsed.managerName,
          managers.map((m) => String(m.name || '')).filter(Boolean),
        ),
        comment: String(parsed.comment || '').trim() || undefined,
      },
    };

    await this.saveMemory({
      domain: 'sales-order',
      audience: 'sales',
      question: text,
      answer: JSON.stringify(result),
      metadata: { type: 'order-draft' },
    });

    return result;
  }

  private safeParseTasksJson(text: string): {
    tasks: Array<{
      title?: string;
      description?: string;
      assigneeId?: string;
      assigneeName?: string;
      assigneeRole?: string;
      priority?: string;
      deadline?: string | null;
    }>;
  } | null {
    const raw = String(text || '').trim();
    if (!raw) return null;
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start < 0 || end <= start) return null;
    try {
      const parsed = JSON.parse(raw.slice(start, end + 1)) as {
        tasks?: Array<{
          title?: string;
          description?: string;
          assigneeId?: string;
          assigneeName?: string;
          assigneeRole?: string;
          priority?: string;
          deadline?: string | null;
        }>;
      };
      if (!Array.isArray(parsed.tasks)) return null;
      return { tasks: parsed.tasks };
    } catch {
      return null;
    }
  }

  private normalizePriority(priority?: string): 'low' | 'medium' | 'high' | 'urgent' {
    if (
      priority === 'low' ||
      priority === 'medium' ||
      priority === 'high' ||
      priority === 'urgent'
    ) {
      return priority;
    }
    return 'medium';
  }

  private normalizeDate(date?: string | null): string | null {
    if (!date) return null;
    const raw = String(date).trim();
    if (!raw) return null;
    const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    return `${m[1]}-${m[2]}-${m[3]}`;
  }

  private normalizeMonth(raw?: string | null): string {
    const value = String(raw || '').trim();
    if (/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return value;
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${now.getFullYear()}-${month}`;
  }

  private normalizeDateString(raw?: string | null): string | null {
    const v = String(raw || '').trim();
    if (!v) return null;
    const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    return `${m[1]}-${m[2]}-${m[3]}`;
  }

  private toSafeInt(value: unknown): number {
    const n = Number(value ?? 0);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.round(n));
  }

  private normalizePlanItemType(raw?: string): 'post' | 'reels' | 'story' | 'other' {
    if (raw === 'post' || raw === 'reels' || raw === 'story' || raw === 'other') return raw;
    return 'other';
  }

  private safeParseMarketingDraftJson(text: string): {
    managerId?: string;
    managerName?: string;
    managerRole?: string;
    month?: string;
    planMode?: 'week' | 'month';
    periodStart?: string | null;
    periodEnd?: string | null;
    plannedPosts?: number;
    plannedReels?: number;
    salaryBase?: number;
    note?: string;
    planItems?: Array<{
      id?: string;
      date?: string;
      type?: 'post' | 'reels' | 'story' | 'other';
      title?: string;
      done?: boolean;
    }>;
  } | null {
    const raw = String(text || '').trim();
    if (!raw) return null;
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start < 0 || end <= start) return null;
    try {
      return JSON.parse(raw.slice(start, end + 1)) as {
        managerId?: string;
        managerName?: string;
        managerRole?: string;
        month?: string;
        planMode?: 'week' | 'month';
        periodStart?: string | null;
        periodEnd?: string | null;
        plannedPosts?: number;
        plannedReels?: number;
        salaryBase?: number;
        note?: string;
        planItems?: Array<{
          id?: string;
          date?: string;
          type?: 'post' | 'reels' | 'story' | 'other';
          title?: string;
          done?: boolean;
        }>;
      };
    } catch {
      return null;
    }
  }

  private safeParseMaterialsHelpJson(text: string): {
    answer?: string;
    recommendedMaterials?: Array<{
      id?: string;
      title?: string;
      reason?: string;
      url?: string;
    }>;
  } | null {
    const raw = String(text || '').trim();
    if (!raw) return null;
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start < 0 || end <= start) return null;
    try {
      return JSON.parse(raw.slice(start, end + 1)) as {
        answer?: string;
        recommendedMaterials?: Array<{
          id?: string;
          title?: string;
          reason?: string;
          url?: string;
        }>;
      };
    } catch {
      return null;
    }
  }

  private safeParseOrderDraftJson(text: string): {
    clientName?: string;
    clientPhone?: string;
    clientAddress?: string;
    branchName?: string;
    productName?: string;
    quantity?: number;
    price?: number;
    saleType?: 'office' | 'delivery';
    paymentType?: 'cash' | 'installment' | 'hybrid' | 'booking' | 'manual';
    paymentLabel?: string;
    installmentMonths?: number;
    deliveryCost?: number;
    clientPaysDelivery?: boolean;
    bookingDeposit?: number;
    bookingBuyout?: number;
    managerName?: string;
    comment?: string;
  } | null {
    const raw = String(text || '').trim();
    if (!raw) return null;
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start < 0 || end <= start) return null;
    try {
      return JSON.parse(raw.slice(start, end + 1)) as {
        clientName?: string;
        clientPhone?: string;
        clientAddress?: string;
        branchName?: string;
        productName?: string;
        quantity?: number;
        price?: number;
        saleType?: 'office' | 'delivery';
        paymentType?: 'cash' | 'installment' | 'hybrid' | 'booking' | 'manual';
        paymentLabel?: string;
        installmentMonths?: number;
        deliveryCost?: number;
        clientPaysDelivery?: boolean;
        bookingDeposit?: number;
        bookingBuyout?: number;
        managerName?: string;
        comment?: string;
      };
    } catch {
      return null;
    }
  }

  private normalizePaymentType(
    value?: string,
  ): 'cash' | 'installment' | 'hybrid' | 'booking' | 'manual' {
    if (
      value === 'cash' ||
      value === 'installment' ||
      value === 'hybrid' ||
      value === 'booking' ||
      value === 'manual'
    ) {
      return value;
    }
    return 'cash';
  }

  private async createEmbedding(input: string): Promise<number[] | null> {
    const apiKey = process.env.AI_API_KEY?.trim();
    if (!apiKey) return null;
    const providerUrl =
      process.env.AI_BASE_URL?.trim() || 'https://api.openai.com/v1';
    const embeddingModel = process.env.AI_EMBED_MODEL?.trim() || 'text-embedding-3-small';

    const res = await fetch(`${providerUrl.replace(/\/+$/, '')}/embeddings`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: embeddingModel,
        input: String(input || '').slice(0, 8000),
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      data?: Array<{ embedding?: number[] }>;
    };
    const embedding = data?.data?.[0]?.embedding;
    if (!Array.isArray(embedding) || embedding.length === 0) return null;
    return embedding.map((x) => Number(x));
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const len = Math.min(a.length, b.length);
    if (len === 0) return -1;
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < len; i++) {
      const av = Number(a[i] || 0);
      const bv = Number(b[i] || 0);
      dot += av * bv;
      normA += av * av;
      normB += bv * bv;
    }
    if (normA === 0 || normB === 0) return -1;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private async getMemoryContext(params: {
    domain: string;
    audience?: string;
    queryText: string;
  }): Promise<string> {
    const queryEmbedding = await this.createEmbedding(params.queryText);
    if (!queryEmbedding) return '';

    const scopeRows = await this.aiMemoriesRepo.find({
      where: {
        domain: params.domain,
      },
      order: { createdAt: 'DESC' },
      take: 120,
    });

    const filtered = params.audience
      ? scopeRows.filter((x) => !x.audience || x.audience === params.audience)
      : scopeRows;

    const scored = filtered
      .map((row) => ({
        row,
        score: this.cosineSimilarity(queryEmbedding, Array.isArray(row.embedding) ? row.embedding : []),
      }))
      .filter((x) => x.score > 0.45)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);

    if (!scored.length) return '';
    return scored
      .map(
        (x, idx) =>
          `${idx + 1}) Q: ${x.row.question}\nA: ${String(x.row.answer || '').slice(0, 600)}`,
      )
      .join('\n---\n');
  }

  private async saveMemory(params: {
    domain: string;
    audience?: string;
    question: string;
    answer: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const text = `Q: ${params.question}\nA: ${params.answer}`;
    const embedding = await this.createEmbedding(text);
    if (!embedding) return;

    const entity = this.aiMemoriesRepo.create({
      domain: params.domain,
      audience: params.audience || null,
      question: params.question,
      answer: params.answer,
      embedding,
      metadata: params.metadata || null,
    });
    await this.aiMemoriesRepo.save(entity);
    await this.trimMemory(params.domain);
  }

  private async trimMemory(domain: string): Promise<void> {
    const keep = 2000;
    const rows = await this.aiMemoriesRepo.find({
      where: { domain },
      order: { createdAt: 'DESC' },
      take: keep + 200,
    });
    if (rows.length <= keep) return;
    const removeIds = rows.slice(keep).map((x) => x.id);
    if (removeIds.length) {
      await this.aiMemoriesRepo
        .createQueryBuilder()
        .delete()
        .from(AiMemoryEntity)
        .where('id IN (:...ids)', { ids: removeIds })
        .execute();
    }
  }

  private safeParseAiJson(text: string): {
    summary: string;
    risks: string[];
    opportunities: string[];
    recommendations: string[];
  } | null {
    const raw = String(text || '').trim();
    if (!raw) return null;
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start < 0 || end <= start) return null;
    try {
      const parsed = JSON.parse(raw.slice(start, end + 1)) as {
        summary?: string;
        risks?: string[];
        opportunities?: string[];
        recommendations?: string[];
      };
      return {
        summary: String(parsed.summary || 'Анализ сформирован.'),
        risks: Array.isArray(parsed.risks) ? parsed.risks.map((x) => String(x)) : [],
        opportunities: Array.isArray(parsed.opportunities)
          ? parsed.opportunities.map((x) => String(x))
          : [],
        recommendations: Array.isArray(parsed.recommendations)
          ? parsed.recommendations.map((x) => String(x))
          : [],
      };
    } catch {
      return null;
    }
  }

}
