const express = require('express');
const router = express.Router();
const stealthMiddleware = require('../../middleware/stealth');
router.use(stealthMiddleware);
router.get('/status', (req, res) => { res.json({ stealth: true, disguised: true }); });
module.exports = router;
