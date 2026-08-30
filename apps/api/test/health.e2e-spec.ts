import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';

describe('Health (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

    app = moduleRef.createNestApplication();
    // Mesma configuração do main.ts: o que testamos é o que roda.
    configureApp(app, { globalPrefix: 'api', isProduction: false });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('liveness responde 200 sem tocar em dependências', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/health/live');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('readiness reporta o estado do banco', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/health/ready');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.checks.database.status).toBe('up');
    expect(response.body.checks.database.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('rota inexistente responde em problem+json com código estável', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/nao-existe');

    expect(response.status).toBe(404);
    expect(response.headers['content-type']).toContain('application/problem+json');
    expect(response.body).toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
      type: 'https://docs.mynotes.app/errors/not-found',
    });
  });
});
