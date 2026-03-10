const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Use Gmail App Password
    },
  });
};

// Welcome email on registration
const sendWelcomeEmail = async (email, name) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('Email credentials not set. Skipping email.');
    return;
  }

  const transporter = createTransporter();

  await transporter.sendMail({
    from: `"IndiaAustria Community" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🇮🇳 Welcome to IndiaAustria Student Community! 🇦🇹',
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; background: #0A0A0F; color: #F0EDE8; padding: 40px; border-radius: 16px;">
        <div style="text-align: center; font-size: 2rem; margin-bottom: 20px;">🇮🇳 ✕ 🇦🇹</div>
        <h1 style="color: #FF6B00; font-size: 1.6rem; margin-bottom: 12px;">Welcome, ${name}! 🎉</h1>
        <p style="color: #9994A3; line-height: 1.7;">
          You've successfully joined the <strong style="color: #F0EDE8;">IndiaAustria Student Community</strong> — a platform built for Indian students in Austria.
        </p>
        <div style="background: #111118; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <p style="margin: 0 0 8px; font-weight: 700;">What you can do now:</p>
          <ul style="color: #9994A3; padding-left: 20px; line-height: 2;">
            <li>📢 Read latest announcements</li>
            <li>❓ Ask doubts — get answers within 24h</li>
            <li>📸 Share photos from your university life</li>
            <li>💬 Chat with the community in real-time</li>
          </ul>
        </div>
        <p style="color: #5C5870; font-size: 0.85rem;">
          Need help? Contact admin at <a href="mailto:jerinjohnbusiness@gmail.com" style="color: #FF6B00;">jerinjohnbusiness@gmail.com</a>
        </p>
      </div>
    `,
  });
};

// Email when admin responds to enquiry
const sendEnquiryResponseEmail = async (email, name, subject, response) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;

  const transporter = createTransporter();

  await transporter.sendMail({
    from: `"IndiaAustria Admin" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `✅ Your question has been answered: "${subject}"`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; background: #0A0A0F; color: #F0EDE8; padding: 40px; border-radius: 16px;">
        <div style="text-align: center; font-size: 2rem; margin-bottom: 20px;">🇮🇳 ✕ 🇦🇹</div>
        <h1 style="color: #22C55E; font-size: 1.4rem; margin-bottom: 12px;">Your question has been answered! ✅</h1>
        <p style="color: #9994A3;">Hi ${name},</p>
        <p style="color: #9994A3; line-height: 1.7;">Admin has responded to your question: <strong style="color: #F0EDE8;">${subject}</strong></p>
        <div style="background: rgba(34,197,94,0.06); border: 1px solid rgba(34,197,94,0.2); border-radius: 12px; padding: 20px; margin: 20px 0;">
          <p style="font-size: 0.8rem; font-weight: 700; color: #22C55E; text-transform: uppercase; margin-bottom: 8px;">Admin Response</p>
          <p style="color: #F0EDE8; line-height: 1.7; white-space: pre-wrap;">${response}</p>
        </div>
        <p style="color: #5C5870; font-size: 0.85rem;">Login to the platform to view your full enquiry history.</p>
      </div>
    `,
  });
};

module.exports = { sendWelcomeEmail, sendEnquiryResponseEmail };
