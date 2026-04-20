const User = require('../../../src/models/User');
describe('User Model', () => {
  it('should hash password on save', async () => {
    const user = new User({ email: 'test@test.com', password: 'password', fullName: 'Test', phone: '+123456789' });
    await user.save();
    expect(user.password).not.toBe('password');
  });
});
