const obfuscateData = (data) => Buffer.from(JSON.stringify(data)).toString('base64');
const deobfuscateData = (encoded) => JSON.parse(Buffer.from(encoded, 'base64').toString());
module.exports = { obfuscateData, deobfuscateData };
