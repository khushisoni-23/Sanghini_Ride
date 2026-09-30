import nodemailer from 'nodemailer';
import env from '../config/env.js';

let transporter = null;

/**
 * Initialize or get Nodemailer transporter
 */
function getTransporter() {
  if (transporter) return transporter;

  const emailUser = env.EMAIL_USER;
  const emailPass = env.EMAIL_PASS;

  if (emailUser && emailPass) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });
    console.log(`📧 Nodemailer Gmail Transporter initialized for: ${emailUser}`);
  } else {
    // Development fallback mock transporter
    transporter = {
      sendMail: async (options) => {
        console.log('\n======================================================');
        console.log('📧 [DEV EMAIL SIMULATOR] Real credentials not set in .env');
        console.log(`To:      ${options.to}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`Preview: ${options.text || 'HTML Email Body'}`);
        console.log('======================================================\n');
        return { messageId: 'simulated_' + Date.now(), response: '250 OK (Simulated)' };
      },
    };
  }

  return transporter;
}

/**
 * Send 6-digit OTP verification code via Real Email
 * @param {string} toEmail
 * @param {string} otp
 * @param {string} name
 */
export async function sendOtpEmail(toEmail, otp, name = 'Valued Rider') {
  const mailer = getTransporter();

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f7f3fb; margin: 0; padding: 20px; color: #1e1e24; }
        .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(124, 58, 237, 0.08); border: 1px solid #ede9fe; }
        .header { background: linear-gradient(135deg, #7c3aed 0%, #db2777 100%); padding: 36px 30px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
        .header p { margin: 8px 0 0; opacity: 0.9; font-size: 14px; font-weight: 500; }
        .content { padding: 36px 30px; text-align: center; }
        .greeting { font-size: 17px; margin-bottom: 20px; color: #374151; }
        .otp-box { background: #f5f3ff; border: 2px dashed #7c3aed; border-radius: 14px; padding: 22px; margin: 26px auto; display: inline-block; min-width: 240px; }
        .otp-code { font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #7c3aed; margin: 0; font-family: monospace; }
        .expiry { color: #dc2626; font-size: 13px; font-weight: 600; margin-top: 14px; }
        .note { font-size: 13px; color: #6b7280; line-height: 1.6; margin-top: 24px; text-align: left; background: #f9fafb; padding: 14px; border-radius: 8px; }
        .footer { padding: 20px 30px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Sanghini Ride</h1>
          <p>Udaipur Women Safe Mobility Initiative</p>
        </div>
        <div class="content">
          <p class="greeting">Namaste <strong>${name}</strong>,</p>
          <p style="color: #4b5563; font-size: 15px; margin: 0;">Use the 6-digit verification code below to verify your account registration.</p>
          
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
          </div>
          
          <p class="expiry">⏱️ This code is valid for 10 minutes only.</p>
          
          <div class="note">
            🛡️ <strong>Security Tip:</strong> Never share this code with anyone, including Sanghini drivers or representatives. If you did not request this verification, please ignore this email.
          </div>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} Sanghini Ride Technologies Pvt. Ltd., Udaipur, Rajasthan<br>
          Her Journey, Her Way • Safe, Empowered & Reliable
        </div>
      </div>
    </body>
    </html>
  `;

  const info = await mailer.sendMail({
    from: `"Sanghini Ride Security" <${env.EMAIL_USER || 'security@sanghiniride.com'}>`,
    to: toEmail,
    subject: `${otp} is your Sanghini Ride Verification Code`,
    text: `Namaste ${name}, Your Sanghini Ride verification code is ${otp}. It will expire in 10 minutes.`,
    html,
  });

  return info;
}

/**
 * Send Welcome Email upon successful verified registration
 * @param {string} toEmail
 * @param {string} name
 * @param {string} role
 */
export async function sendWelcomeEmail(toEmail, name = 'Valued Rider', role = 'passenger') {
  const mailer = getTransporter();

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f7f3fb; margin: 0; padding: 20px; color: #1e1e24; }
        .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(124, 58, 237, 0.08); border: 1px solid #ede9fe; }
        .header { background: linear-gradient(135deg, #7c3aed 0%, #db2777 100%); padding: 36px 30px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 26px; font-weight: 800; }
        .content { padding: 32px 30px; }
        .badge { background: #f3e8ff; color: #7c3aed; padding: 6px 14px; border-radius: 20px; font-weight: 700; font-size: 13px; display: inline-block; margin-bottom: 16px; }
        .btn { display: inline-block; background: #7c3aed; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 700; margin-top: 20px; }
        .footer { padding: 20px 30px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Sanghini Ride!</h1>
          <p style="margin: 6px 0 0; opacity: 0.9;">Safe & Verified Women Mobility in Udaipur</p>
        </div>
        <div class="content">
          <span class="badge">Account Verified Successfully ✅</span>
          <h2 style="margin: 0 0 14px; color: #111827;">Namaste ${name},</h2>
          <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">
            We are thrilled to welcome you to the Sanghini Ride family. Your ${role} account has been verified with high safety and security standards.
          </p>
          <ul style="color: #4b5563; font-size: 14px; line-height: 1.8; padding-left: 20px;">
            <li>🛡️ 100% verified women drivers and passengers</li>
            <li>📍 Live real-time GPS tracking & SOS emergency sharing</li>
            <li>💳 Fair, transparent fare calculation and instant receipts</li>
          </ul>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} Sanghini Ride Technologies Pvt. Ltd., Udaipur, Rajasthan
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await mailer.sendMail({
      from: `"Sanghini Ride" <${env.EMAIL_USER || 'welcome@sanghiniride.com'}>`,
      to: toEmail,
      subject: `Welcome to Sanghini Ride, ${name}! 🦋`,
      text: `Namaste ${name}, Welcome to Sanghini Ride! Your account has been verified. Safe travels across Udaipur!`,
      html,
    });
  } catch (err) {
    console.warn('Could not send welcome email:', err.message);
  }
}
