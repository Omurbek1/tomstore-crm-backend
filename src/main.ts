import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { existsSync, mkdirSync } from 'fs';
import { Client } from 'pg';
import { join } from 'path';
import { AppModule } from './app.module';

async function ensureDatabaseExists(): Promise<void> {
  const host = process.env.DB_HOST ?? 'localhost';
  const port = Number(process.env.DB_PORT ?? 5432);
  const user = process.env.DB_USERNAME ?? 'postgres';
  const password = process.env.DB_PASSWORD ?? 'postgres';
  const database = process.env.DB_NAME ?? process.env.DB_DATABASE ?? 'tomstore';
  const maintenanceDb = process.env.DB_ADMIN_DB ?? 'postgres';

  const client = new Client({
    host,
    port,
    user,
    password,
    database: maintenanceDb,
  });

  await client.connect();
  try {
    const exists = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [database],
    );

    if (exists.rowCount === 0) {
      const escapedName = database.replace(/"/g, '""');
      await client.query(`CREATE DATABASE "${escapedName}"`);
    }
  } finally {
    await client.end();
  }
}

async function bootstrap() {
  await ensureDatabaseExists();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const uploadsDir = join(process.cwd(), 'uploads');
  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
  }
  app.useStaticAssets(uploadsDir, { prefix: '/uploads/' });
  app.enableCors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: false,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
