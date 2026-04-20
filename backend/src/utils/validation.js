const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPhone = (phone) => /^\+?[1-9]\d{1,14}$/.test(phone);
module.exports = { isValidEmail, isValidPhone };
