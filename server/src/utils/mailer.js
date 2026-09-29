import nodemailer from 'nodemailer';
import { config } from '../config/index.js';
import { AppError } from './errors.js';

let transporter;
const configured = () => config.smtp.host && config.smtp.user && config.smtp.pass;

export async function sendOtpEmail(to, otp) {
  if (!configured()) {
    if (config.isProd) throw new AppError(503, 'EMAIL_FAILED', 'We could not send the OTP email right now. Please try again later.');
    // Development convenience ONLY (never in production).
    console.warn(`[DEV] SMTP not configured. OTP for ${to}: ${otp}`);
    return;
  }
  transporter ||= nodemailer.createTransport({
    host: config.smtp.host, port: config.smtp.port, secure: config.smtp.port === 465,
    auth: { user: config.smtp.user, pass: config.smtp.pass }
  });
  try {
    await transporter.sendMail({
      from: `"Unique Designs" <${config.smtp.user}>`, to,
      subject: 'Your Unique Designs password reset code',
      text: `Your verification code is ${otp}. It expires in 5 minutes. If you did not request this, ignore this email.`,
      html: `<div style="font-family:Arial,sans-serif"><h2>Unique Designs</h2><p>Your verification code:</p><p style="font-size:30px;letter-spacing:6px"><b>${otp}</b></p><p>Expires in 5 minutes. If you did not request this, ignore this email.</p></div>`
    });
  } catch (e) {
    console.error('SMTP error:', e.code || e.message);
    throw new AppError(503, 'EMAIL_FAILED', 'We could not send the OTP email right now. Please try again later.');
  }
}
