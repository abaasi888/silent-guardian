const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const randomString = (length = 10) => Math.random().toString(36).substring(2, 2+length);
module.exports = { sleep, randomString };
