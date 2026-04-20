const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({ host: process.env.EMAIL_HOST, port: process.env.EMAIL_PORT, secure: false, auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS } });
const sendVerificationEmail = async (to, token) => { const url = `${process.env.FRONTEND_URL}/verify-email?token=${token}`; await transporter.sendMail({ from: `"Silent Guardian" <${process.env.EMAIL_USER}>`, to, subject: 'Verify your email', html: `<a href="${url}">Click here to verify</a>` }); };
const sendPasswordResetEmail = async (to, token) => { const url = `${process.env.FRONTEND_URL}/reset-password?token=${token}`; await transporter.sendMail({ from: `"Silent Guardian" <${process.env.EMAIL_USER}>`, to, subject: 'Reset your password', html: `<a href="${url}">Reset password</a>` }); };
module.exports = { sendVerificationEmail, sendPasswordResetEmail };
