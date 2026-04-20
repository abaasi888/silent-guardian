const logout = async (req, res) => {
  try { req.user.refreshToken = null; await req.user.save(); res.json({ message: 'Logged out' }); } catch (err) { res.status(500).json({ error: err.message }); }
};
module.exports = logout;
