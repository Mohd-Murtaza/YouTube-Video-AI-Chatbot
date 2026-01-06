import nodemailer from 'nodemailer';

// Lazy transporter creation - only when needed (runtime)
let transporter = null;

function getTransporter() {
  if (!transporter) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
      throw new Error('❌ Email credentials missing! Required: EMAIL_USER and EMAIL_APP_PASSWORD');
    }
    
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    });
    
    // Verify transporter configuration only after creation
    transporter.verify((error, success) => {
      if (error) {
        console.error('❌ Email transporter error:', error);
        console.error('Check EMAIL_USER:', process.env.EMAIL_USER ? '✅ Set' : '❌ Missing');
        console.error('Check EMAIL_APP_PASSWORD:', process.env.EMAIL_APP_PASSWORD ? '✅ Set' : '❌ Missing');
      } else {
        console.log('✅ Email server is ready to send messages');
        console.log('📧 Using email:', process.env.EMAIL_USER);
      }
    });
  }
  return transporter;
}

/**
 * Send OTP email
 */
export async function sendOTPEmail(email, otp, name, purpose = 'email_verification') {
  const subject = purpose === 'email_verification' 
    ? '🔐 Verify Your Email - YouTube AI Chatbot'
    : '🔑 Reset Your Password - YouTube AI Chatbot';

  const html = purpose === 'email_verification'
    ? getVerificationEmailHTML(name, otp)
    : getPasswordResetEmailHTML(name, otp);

  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail({
      from: `"YouTube AI Chatbot" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      html,
    });

    console.log('✅ Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email send error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Email template for verification
 */
function getVerificationEmailHTML(name, otp) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .container {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 30px;
          border-radius: 10px;
          color: white;
        }
        .otp-box {
          background: white;
          color: #333;
          padding: 20px;
          text-align: center;
          border-radius: 8px;
          margin: 20px 0;
        }
        .otp {
          font-size: 32px;
          font-weight: bold;
          letter-spacing: 8px;
          color: #667eea;
        }
        .footer {
          margin-top: 20px;
          font-size: 12px;
          opacity: 0.8;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🎉 Welcome to YouTube AI Chatbot!</h1>
        <p>Hi <strong>${name}</strong>,</p>
        <p>Thank you for registering! Please use the OTP below to verify your email address:</p>
        
        <div class="otp-box">
          <p style="margin: 0; font-size: 14px; color: #666;">Your Verification Code</p>
          <div class="otp">${otp}</div>
          <p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">Valid for 15 minutes</p>
        </div>

        <p>⚠️ <strong>Important:</strong></p>
        <ul>
          <li>This OTP will expire in 15 minutes</li>
          <li>Don't share this code with anyone</li>
          <li>If you didn't request this, please ignore this email</li>
        </ul>

        <div class="footer">
          <p>This is an automated email. Please do not reply.</p>
          <p>© 2026 YouTube AI Chatbot. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Email template for password reset
 */
function getPasswordResetEmailHTML(name, otp) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .container {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          padding: 30px;
          border-radius: 10px;
          color: white;
        }
        .otp-box {
          background: white;
          color: #333;
          padding: 20px;
          text-align: center;
          border-radius: 8px;
          margin: 20px 0;
        }
        .otp {
          font-size: 32px;
          font-weight: bold;
          letter-spacing: 8px;
          color: #f5576c;
        }
        .footer {
          margin-top: 20px;
          font-size: 12px;
          opacity: 0.8;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🔑 Password Reset Request</h1>
        <p>Hi <strong>${name}</strong>,</p>
        <p>You requested to reset your password. Please use the OTP below:</p>
        
        <div class="otp-box">
          <p style="margin: 0; font-size: 14px; color: #666;">Your Reset Code</p>
          <div class="otp">${otp}</div>
          <p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">Valid for 15 minutes</p>
        </div>

        <p>⚠️ <strong>Security Notice:</strong></p>
        <ul>
          <li>This OTP will expire in 15 minutes</li>
          <li>Never share this code with anyone</li>
          <li>If you didn't request this, please secure your account immediately</li>
          <li>Your password won't change until you complete the reset process</li>
        </ul>

        <div class="footer">
          <p>This is an automated email. Please do not reply.</p>
          <p>© 2026 YouTube AI Chatbot. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
