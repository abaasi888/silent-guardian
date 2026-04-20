const submitKYC = async (req, res) => {
  const { documentType, documentNumber, documentImage } = req.body;
  req.user.kycData = { documentType, documentNumber, documentImage, submittedAt: new Date() };
  req.user.kycStatus = 'pending'; await req.user.save(); res.json({ message: 'KYC submitted for review' });
};
const getKYCStatus = async (req, res) => { res.json({ status: req.user.kycStatus }); };
module.exports = { submitKYC, getKYCStatus };
