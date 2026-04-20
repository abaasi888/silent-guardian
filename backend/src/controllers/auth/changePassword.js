const changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!(await req.user.comparePassword(oldPassword))) return res.status(401).json({ error: 'Incorrect old password' });
  req.user.password = newPassword; await req.user.save(); res.json({ message: 'Password changed' });
};
module.exports = changePassword;
