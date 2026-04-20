import CryptoJS from 'crypto-js';
export const encrypt = (data, secret) => CryptoJS.AES.encrypt(JSON.stringify(data), secret).toString();
export const decrypt = (cipher, secret) => JSON.parse(CryptoJS.AES.decrypt(cipher, secret).toString(CryptoJS.enc.Utf8));
