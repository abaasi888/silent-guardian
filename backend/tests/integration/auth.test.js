const request = require('supertest');
const app = require('../../src/app');
describe('Auth Integration', () => {
  it('should register a user', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({ email: 'test@test.com', password: '123456', fullName: 'Test User', phone: '+123456789' });
    expect(res.statusCode).toBe(201);
  });
});
