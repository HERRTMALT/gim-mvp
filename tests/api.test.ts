import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';

process.env.NODE_ENV = 'test';
process.env.DATABASE_PATH = ':memory:';
process.env.SESSION_SECRET = 'test-secret-con-mas-de-32-caracteres-para-firmar';
process.env.OWNER_PASSWORD = 'clave-de-prueba';
process.env.OWNER_PASSWORD_HASH = '';
process.env.GYM_NAME = 'Gimnasio Test';
process.env.APP_URL = 'http://localhost:5173';
process.env.LOG_LEVEL = 'silent';

let app: Express;
let closeDb: () => void;

beforeAll(async () => {
  const [{ createApp }, { runMigrations }, { seedDatabase }, db] = await Promise.all([
    import('../src/server/app'),
    import('../src/server/infra/db/migrate'),
    import('../src/server/infra/db/seed'),
    import('../src/server/infra/db/index'),
  ]);
  runMigrations();
  seedDatabase();
  app = createApp();
  closeDb = db.closeDb;
});

afterAll(() => {
  closeDb?.();
});

async function loginAgent() {
  const agent = request.agent(app);
  await agent
    .post('/api/auth/login')
    .send({ password: 'clave-de-prueba' })
    .expect(200);
  return agent;
}

describe('autenticación', () => {
  it('expone el estado de salud sin autenticación', async () => {
    const response = await request(app).get('/api/health').expect(200);
    expect(response.body.ok).toBe(true);
  });

  it('rechaza endpoints protegidos sin sesión', async () => {
    await request(app).get('/api/members').expect(401);
    await request(app).get('/api/dashboard').expect(401);
    await request(app).get('/api/plans').expect(401);
  });

  it('rechaza una contraseña incorrecta', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ password: 'incorrecta' })
      .expect(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('inicia sesión y devuelve los datos del gimnasio', async () => {
    const agent = await loginAgent();
    const me = await agent.get('/api/auth/me').expect(200);
    expect(me.body).toMatchObject({ authenticated: true, gymName: 'Gimnasio Test' });
  });

  it('bloquea escrituras con un origen no permitido', async () => {
    const agent = await loginAgent();
    const response = await agent
      .post('/api/members')
      .set('Origin', 'https://sitio-malicioso.example')
      .send({ firstName: 'Eva', lastName: 'Mala' })
      .expect(403);
    expect(response.body.error.code).toBe('CSRF');
  });
});

describe('flujo de socios, cuotas y rutinas', () => {
  it('crea un socio con datos de salud', async () => {
    const agent = await loginAgent();
    const response = await agent
      .post('/api/members')
      .send({
        firstName: 'Ana',
        lastName: 'Pérez',
        dni: '30111222',
        birthDate: '1990-04-12',
        phone: '11 5555-5555',
        health: {
          conditions: ['knee_pain'],
          injuries: 'Molestia en rodilla derecha',
          medicalClearance: true,
          consentSigned: true,
        },
      })
      .expect(201);

    expect(response.body.member).toMatchObject({
      firstName: 'Ana',
      lastName: 'Pérez',
      status: 'active',
    });
    expect(response.body.member.health.conditions).toEqual(['knee_pain']);
  });

  it('registra una cuota y refleja el plan en el panel', async () => {
    const agent = await loginAgent();
    const created = await agent
      .post('/api/members')
      .send({ firstName: 'Bruno', lastName: 'Gómez' })
      .expect(201);
    const memberId = created.body.member.id as number;

    const plans = await agent.get('/api/plans').expect(200);
    const plan = plans.body.plans.find((item: { daysPerWeek: number }) => item.daysPerWeek === 3);
    expect(plan).toBeTruthy();

    const response = await agent
      .post(`/api/members/${memberId}/memberships`)
      .send({ planId: plan.id, startsOn: '2026-11-01', endsOn: '2026-12-01' })
      .expect(201);

    expect(response.body.member.currentMembership).toMatchObject({
      planId: plan.id,
      planName: plan.name,
      priceCents: plan.priceCents,
    });

    const dashboard = await agent.get('/api/dashboard').expect(200);
    expect(dashboard.body.totalMembers).toBeGreaterThanOrEqual(1);
  });

  it('valida el rango de fechas de la cuota', async () => {
    const agent = await loginAgent();
    const response = await agent
      .post('/api/members/1/memberships')
      .send({ planId: 1, startsOn: '2026-12-01', endsOn: '2026-11-01' })
      .expect(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('previsualiza, guarda y regenera una rutina', async () => {
    const agent = await loginAgent();
    const created = await agent
      .post('/api/members')
      .send({ firstName: 'Carla', lastName: 'Ruiz' })
      .expect(201);
    const memberId = created.body.member.id as number;

    const input = {
      goal: 'muscle_gain',
      level: 'intermediate',
      daysPerWeek: 4,
      sessionMinutes: 75,
      equipment: ['bodyweight', 'dumbbells', 'machines', 'bench', 'bands'],
      sport: 'football',
      footballSeason: 'pre_season',
      age: 24,
      conditions: [],
      injuries: '',
      medicalClearance: true,
      parq: [],
      notes: '',
    };

    const preview = await agent
      .post(`/api/members/${memberId}/routines/preview`)
      .send(input)
      .expect(200);
    expect(preview.body.plan.days).toHaveLength(4);
    expect(typeof preview.body.seed).toBe('number');

    const saved = await agent
      .post(`/api/members/${memberId}/routines`)
      .send({ input: { ...input, seed: preview.body.seed }, plan: preview.body.plan })
      .expect(201);
    const routineId = saved.body.routine.id as number;
    expect(saved.body.routine.version).toBe(1);

    const pdf = await agent.get(`/api/routines/${routineId}/pdf`).expect(200);
    expect(pdf.headers['content-type']).toContain('application/pdf');
    expect(pdf.body.subarray(0, 4).toString()).toBe('%PDF');

    const regenerated = await agent
      .post(`/api/routines/${routineId}/regenerate`)
      .send({})
      .expect(201);
    expect(regenerated.body.routine.version).toBe(2);
  });

  it('rechaza rutinas con señales de alarma', async () => {
    const agent = await loginAgent();
    const created = await agent
      .post('/api/members')
      .send({ firstName: 'Diego', lastName: 'Sosa' })
      .expect(201);
    const memberId = created.body.member.id as number;

    const response = await agent
      .post(`/api/members/${memberId}/routines/preview`)
      .send({
        goal: 'general_health',
        level: 'beginner',
        daysPerWeek: 3,
        sessionMinutes: 60,
        equipment: ['bodyweight'],
        conditions: ['chest_pain'],
        medicalClearance: false,
      })
      .expect(422);
    expect(response.body.error.code).toBe('ROUTINE_SAFETY');
  });

  it('archiva un socio sin borrar su historial', async () => {
    const agent = await loginAgent();
    const created = await agent
      .post('/api/members')
      .send({ firstName: 'Elena', lastName: 'Díaz' })
      .expect(201);
    const memberId = created.body.member.id as number;

    await agent.post(`/api/members/${memberId}/archive`).expect(200);
    const detail = await agent.get(`/api/members/${memberId}`).expect(200);
    expect(detail.body.member.status).toBe('archived');
  });
});
