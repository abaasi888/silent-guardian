const mongoose = require('mongoose');
const installationTokenSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true }, deviceId: String, userId: mongoose.Schema.Types.ObjectId, expiresAt: { type: Date, required: true, expires: 0 }
});
module.exports = mongoose.model('InstallationToken', installationTokenSchema);
