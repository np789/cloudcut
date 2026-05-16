import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /auth/register creates a user', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Test User',
        email: `test-${Date.now()}@example.com`,
        password: 'password123',
      })
      .expect(201);

    expect(res.body.user.email).toBeDefined();
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
  });

  it('POST /auth/login returns tokens for valid credentials', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'alice@cloudcut.dev', password: 'password123' })
      .expect(201);

    expect(res.body.accessToken).toBeDefined();
  });

  it('POST /auth/login rejects wrong password', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'alice@cloudcut.dev', password: 'wrongpassword' })
      .expect(401);
  });

  it('GET /auth/me returns user when authenticated', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'alice@cloudcut.dev', password: 'password123' });

    const token = loginRes.body.accessToken;

    const meRes = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(meRes.body.email).toBe('alice@cloudcut.dev');
  });

  it('GET /auth/me returns 401 without token', async () => {
    await request(app.getHttpServer()).get('/auth/me').expect(401);
  });
});
