import request from 'supertest';
import app from './index';

describe('Health endpoints', () => {
  it('GET /health should return healthy status', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('healthy');
    expect(response.body.service).toBe('${{ values.service_name }}');
  });

  it('GET /ready should return ready status', async () => {
    const response = await request(app).get('/ready');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ready');
  });
});

describe('API endpoints', () => {
  it('GET /api/hello should return greeting', async () => {
    const response = await request(app).get('/api/hello');
    expect(response.status).toBe(200);
    expect(response.body.message).toContain('Hello');
  });
});
