const updateProfile = async (req, res) => {
  const allowed = ['fullName', 'phone'];
  Object.keys(req.body).forEach(key => { if (allowed.includes(key)) req.user[key] = req.body[key]; });
  await req.user.save(); res.json(req.user);
};
module.exports = updateProfile;
