import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductCategoryEntity } from '../database/entities/product-category.entity';
import { ProductEntity } from '../database/entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productsRepo: Repository<ProductEntity>,
    @InjectRepository(ProductCategoryEntity)
    private readonly categoriesRepo: Repository<ProductCategoryEntity>,
  ) {}

  private normalizePhotoUrls(payload: Partial<ProductEntity>) {
    const list = Array.isArray(payload.photoUrls) ? payload.photoUrls : [];
    const normalized = list
      .map((x) => String(x || '').trim())
      .filter((x) => x.length > 0);
    if (normalized.length > 0) return normalized;
    if (payload.photoUrl) return [payload.photoUrl];
    return null;
  }

  private normalizeCategories(payload: Partial<ProductEntity>) {
    const base = Array.isArray(payload.categories)
      ? payload.categories
      : payload.category
        ? [payload.category]
        : [];
    const normalized = base
      .map((x) => String(x || '').trim())
      .filter((x) => x.length > 0);
    return normalized.length > 0 ? normalized : ['Прочее'];
  }

  private normalizeComboItems(payload: Partial<ProductEntity>) {
    if (!payload.isCombo) return null;

    const items = Array.isArray(payload.comboItems) ? payload.comboItems : [];
    const normalized = items
      .map((item) => ({
        productId: String(item.productId || '').trim(),
        quantity: Number(item.quantity || 0),
      }))
      .filter((item) => item.productId && item.quantity > 0);

    return normalized.length > 0 ? normalized : null;
  }

  private normalizeBarcode(value?: string) {
    const normalized = String(value || '')
      .trim()
      .replace(/\s+/g, '');
    return normalized || undefined;
  }

  findAll(limit?: number, offset?: number) {
    const take = Math.max(1, Math.min(500, Number(limit ?? 200)));
    const skip = Math.max(0, Number(offset ?? 0));
    return this.productsRepo.find({
      order: { createdAt: 'DESC' },
      take,
      skip,
    });
  }

  findCategories() {
    return this.categoriesRepo.find({ order: { name: 'ASC' } });
  }

  async createCategory(payload: { name?: string }) {
    const normalized = String(payload?.name || '').trim();
    if (!normalized) {
      throw new BadRequestException('Название категории обязательно');
    }
    const existing = await this.categoriesRepo.findOne({
      where: { name: normalized },
    });
    if (existing) return existing;

    const created = this.categoriesRepo.create({ name: normalized });
    return this.categoriesRepo.save(created);
  }

  private async syncCategories(names: string[]) {
    if (!names.length) return;
    const uniq = Array.from(new Set(names.map((x) => String(x).trim()).filter(Boolean)));
    for (const name of uniq) {
      const exists = await this.categoriesRepo.findOne({ where: { name } });
      if (!exists) {
        const category = this.categoriesRepo.create({ name });
        await this.categoriesRepo.save(category);
      }
    }
  }

  async create(payload: Partial<ProductEntity>) {
    const isCombo = Boolean(payload.isCombo);
    const comboItems = this.normalizeComboItems({ ...payload, isCombo });
    const photoUrls = this.normalizePhotoUrls(payload);
    const categories = this.normalizeCategories(payload);
    await this.syncCategories(categories);
    const barcode = this.normalizeBarcode(payload.barcode);
    if (barcode) {
      const exists = await this.productsRepo.findOne({ where: { barcode } });
      if (exists) {
        throw new BadRequestException('Штрихкод уже используется');
      }
    }
    const product = this.productsRepo.create({
      name: payload.name ?? '',
      category: categories[0],
      categories,
      costPrice: isCombo ? 0 : Number(payload.costPrice ?? 0),
      sellingPrice: Number(payload.sellingPrice ?? 0),
      supplier: payload.supplier,
      barcode,
      branchName: payload.branchName ?? 'Центральный',
      photoUrl: photoUrls?.[0],
      photoUrls,
      characteristics: payload.characteristics,
      managerEarnings:
        payload.managerEarnings === undefined
          ? undefined
          : Number(payload.managerEarnings),
      managerPercent:
        payload.managerPercent === undefined
          ? undefined
          : Number(payload.managerPercent),
      stockQty:
        payload.stockQty === undefined ? 0 : Number(payload.stockQty ?? 0),
      isCombo,
      comboItems,
    });
    return this.productsRepo.save(product);
  }

  private parseCsvRows(content: string): string[][] {
    const lines = content
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .split('\n')
      .filter((line) => line.trim().length > 0);
    if (lines.length < 2) {
      throw new BadRequestException(
        'CSV должен содержать заголовок и хотя бы одну строку товара',
      );
    }

    const detectDelimiter = (header: string) => {
      const candidates = [',', ';', '\t'];
      let best = ',';
      let bestCount = -1;
      for (const sep of candidates) {
        const count = header.split(sep).length;
        if (count > bestCount) {
          best = sep;
          bestCount = count;
        }
      }
      return best;
    };

    const delimiter = detectDelimiter(lines[0]);
    const parseLine = (line: string): string[] => {
      const out: string[] = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          const next = line[i + 1];
          if (inQuotes && next === '"') {
            cur += '"';
            i++;
            continue;
          }
          inQuotes = !inQuotes;
          continue;
        }
        if (ch === delimiter && !inQuotes) {
          out.push(cur.trim());
          cur = '';
          continue;
        }
        cur += ch;
      }
      out.push(cur.trim());
      return out;
    };

    return lines.map(parseLine);
  }

  async importFromCsvBuffer(
    buffer: Buffer,
    options?: { branchName?: string; fileName?: string },
  ) {
    const text = buffer.toString('utf-8');
    const rows = this.parseCsvRows(text);
    const headers = rows[0].map((h) => h.toLowerCase().trim());

    const findCol = (...aliases: string[]) =>
      headers.findIndex((h) => aliases.includes(h));

    const col = {
      name: findCol('name', 'название'),
      barcode: findCol('barcode', 'штрихкод'),
      categories: findCol('categories', 'category', 'категории', 'категория'),
      costPrice: findCol('costprice', 'cost_price', 'себестоимость'),
      sellingPrice: findCol('sellingprice', 'selling_price', 'цена'),
      supplier: findCol('supplier', 'поставщик'),
      branchName: findCol('branchname', 'branch_name', 'филиал'),
      characteristics: findCol('characteristics', 'характеристики'),
      managerEarnings: findCol(
        'managerearnings',
        'manager_earnings',
        'услугаменеджера',
      ),
      stockQty: findCol('stockqty', 'stock_qty', 'остаток'),
    };

    if (col.name < 0 || col.sellingPrice < 0) {
      throw new BadRequestException(
        'В CSV обязательны колонки: name(название), sellingPrice(цена)',
      );
    }

    const errors: string[] = [];
    let created = 0;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const lineNo = i + 1;
      const value = (idx: number) => (idx >= 0 ? String(row[idx] || '').trim() : '');

      const name = value(col.name);
      const sellingPrice = Number(value(col.sellingPrice) || 0);
      if (!name) {
        errors.push(`Строка ${lineNo}: пустое название`);
        continue;
      }
      if (!Number.isFinite(sellingPrice) || sellingPrice <= 0) {
        errors.push(`Строка ${lineNo}: некорректная цена продажи`);
        continue;
      }

      const rawCategories = value(col.categories);
      const categories = rawCategories
        ? rawCategories
            .split(/[|,;/]/g)
            .map((x) => x.trim())
            .filter(Boolean)
        : ['Прочее'];

      try {
        await this.create({
          name,
          category: categories[0],
          categories,
          costPrice: Number(value(col.costPrice) || 0),
          sellingPrice,
          supplier: value(col.supplier) || undefined,
          barcode: value(col.barcode) || undefined,
          branchName:
            value(col.branchName) || options?.branchName || 'Центральный',
          characteristics: value(col.characteristics) || undefined,
          managerEarnings:
            value(col.managerEarnings).length > 0
              ? Number(value(col.managerEarnings))
              : undefined,
          stockQty: Number(value(col.stockQty) || 0),
          isCombo: false,
          comboItems: null,
        });
        created++;
      } catch (error) {
        const msg =
          error instanceof Error ? error.message : 'ошибка создания товара';
        errors.push(`Строка ${lineNo}: ${msg}`);
      }
    }

    return {
      fileName: options?.fileName,
      totalRows: rows.length - 1,
      created,
      skipped: Math.max(0, rows.length - 1 - created),
      errors: errors.slice(0, 100),
    };
  }

  async update(id: string, payload: Partial<ProductEntity>) {
    const found = await this.productsRepo.findOne({ where: { id } });
    if (!found) {
      throw new NotFoundException('Товар не найден');
    }

    const normalizedPayload: Partial<ProductEntity> = {
      ...payload,
      barcode:
        payload.barcode === undefined
          ? undefined
          : this.normalizeBarcode(payload.barcode),
      category:
        payload.category !== undefined || payload.categories !== undefined
          ? this.normalizeCategories(payload)[0]
          : undefined,
      categories:
        payload.category !== undefined || payload.categories !== undefined
          ? this.normalizeCategories(payload)
          : undefined,
      branchName: payload.branchName,
      costPrice:
        payload.costPrice === undefined
          ? undefined
          : payload.isCombo
            ? 0
            : Number(payload.costPrice ?? 0),
      photoUrl:
        payload.photoUrl !== undefined || payload.photoUrls !== undefined
          ? this.normalizePhotoUrls(payload)?.[0]
          : undefined,
      photoUrls:
        payload.photoUrl !== undefined || payload.photoUrls !== undefined
          ? this.normalizePhotoUrls(payload)
          : undefined,
      stockQty:
        payload.stockQty === undefined
          ? undefined
          : Number(payload.stockQty ?? 0),
      isCombo: payload.isCombo,
      comboItems:
        payload.isCombo === undefined
          ? undefined
          : this.normalizeComboItems(payload),
    };

    const categoriesToSync =
      normalizedPayload.categories && normalizedPayload.categories.length > 0
        ? normalizedPayload.categories
        : undefined;
    if (categoriesToSync) {
      await this.syncCategories(categoriesToSync);
    }

    if (normalizedPayload.barcode) {
      const exists = await this.productsRepo.findOne({
        where: { barcode: normalizedPayload.barcode },
      });
      if (exists && exists.id !== id) {
        throw new BadRequestException('Штрихкод уже используется');
      }
    }

    await this.productsRepo.update(id, normalizedPayload);
    return this.productsRepo.findOneByOrFail({ id });
  }

  async remove(id: string): Promise<{ success: true }> {
    await this.productsRepo.delete(id);
    return { success: true };
  }
}
