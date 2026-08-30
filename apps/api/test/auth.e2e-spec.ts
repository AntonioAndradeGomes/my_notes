import { randomUUID } from 'node:crypto';

import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { PrismaService } from '../src/infra/prisma/prisma.service.js';

describe('Auth e Users (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const suffix = randomUUID();
  const account = {
    name: 'Fulano da Silva',
    email: `fulano+${suffix}@exemplo.com`,
    password: 'uma-senha-bem-longa',
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app, { globalPrefix: 'api', isProduction: false });
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    // Os testes derivam vários e-mails do mesmo sufixo único.
    await prisma.user.deleteMany({ where: { email: { contains: suffix } } });
    await app.close();
  });

  const api = () => request(app.getHttpServer());

  describe('POST /users — cadastro', () => {
    it('cria a conta e devolve só o perfil', async () => {
      const response = await api().post('/api/v1/users').send(account);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({ email: account.email, name: account.name });
      expect(response.body).not.toHaveProperty('passwordHash');
    });

    it('NÃO devolve tokens: o cliente é redirecionado para o login', async () => {
      const response = await api()
        .post('/api/v1/users')
        .send({ ...account, email: `outro+${suffix}@exemplo.com` });

      expect(response.body).not.toHaveProperty('tokens');
      expect(response.body).not.toHaveProperty('accessToken');
      expect(response.body).not.toHaveProperty('refreshToken');
    });

    it('é pública: não exige autenticação', async () => {
      const response = await api()
        .post('/api/v1/users')
        .send({ ...account, email: `publico+${suffix}@exemplo.com` });

      expect(response.status).not.toBe(401);
    });

    it('rejeita e-mail duplicado com 409', async () => {
      const response = await api().post('/api/v1/users').send(account);

      expect(response.status).toBe(409);
      expect(response.body.code).toBe('ALREADY_EXISTS');
    });

    it('rejeita senha curta com 422 e aponta o campo', async () => {
      const response = await api()
        .post('/api/v1/users')
        .send({ ...account, email: `curta+${suffix}@exemplo.com`, password: 'curta' });

      expect(response.status).toBe(422);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.errors).toContainEqual(expect.objectContaining({ field: 'password' }));
    });
  });

  describe('login', () => {
    it('autentica com as credenciais corretas', async () => {
      const response = await api()
        .post('/api/v1/auth/login')
        .send({ email: account.email, password: account.password });

      expect(response.status).toBe(200);
      expect(response.body.tokens.accessToken).toBeTruthy();
    });

    it('não distingue senha errada de e-mail inexistente', async () => {
      const wrongPassword = await api()
        .post('/api/v1/auth/login')
        .send({ email: account.email, password: 'senha-errada-mesmo' });

      const unknownEmail = await api()
        .post('/api/v1/auth/login')
        .send({ email: 'ninguem@exemplo.com', password: 'senha-errada-mesmo' });

      expect(wrongPassword.status).toBe(401);
      expect(unknownEmail.status).toBe(401);
      expect(wrongPassword.body.code).toBe(unknownEmail.body.code);
      expect(wrongPassword.body.title).toBe(unknownEmail.body.title);
    });
  });

  describe('rotas protegidas', () => {
    let accessToken: string;

    beforeAll(async () => {
      const login = await api()
        .post('/api/v1/auth/login')
        .send({ email: account.email, password: account.password });
      accessToken = login.body.tokens.accessToken;
    });

    it('recusa acesso sem token', async () => {
      const response = await api().get('/api/v1/users/me');

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('UNAUTHENTICATED');
      expect(response.headers['content-type']).toContain('application/problem+json');
    });

    it('devolve o perfil com token válido', async () => {
      const response = await api()
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ email: account.email, name: account.name });
      expect(response.body).not.toHaveProperty('passwordHash');
    });

    it('atualiza o nome', async () => {
      const response = await api()
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Fulano de Tal' });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Fulano de Tal');
    });

    it('lista as sessões ativas', async () => {
      const response = await api()
        .get('/api/v1/users/me/sessions')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('responde 404 para sessão de outro usuário', async () => {
      const response = await api()
        .delete(`/api/v1/users/me/sessions/${randomUUID()}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
      expect(response.body.code).toBe('NOT_FOUND');
    });
  });

  describe('rotação de refresh token', () => {
    it('emite um par novo e invalida o anterior', async () => {
      const login = await api()
        .post('/api/v1/auth/login')
        .send({ email: account.email, password: account.password });

      const first = login.body.tokens.refreshToken;
      const renewed = await api().post('/api/v1/auth/refresh').send({ refreshToken: first });

      expect(renewed.status).toBe(200);
      expect(renewed.body.refreshToken).not.toBe(first);

      // Reapresentar o token consumido não pode funcionar.
      const reused = await api().post('/api/v1/auth/refresh').send({ refreshToken: first });
      expect(reused.status).toBe(401);
    });
  });
});
