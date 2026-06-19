// backend/src/config/mailer.js

const nodemailer = require('nodemailer');

/**
 * Configure Nodemailer Transporter
 * A Transporter is the connection configuration that Nodemailer uses to talk to 
 * the email server (using the SMTP mailing protocol).
 */
const createTransporter = async () => {
  // If you configure SMTP credentials in your .env, use them:
  if (
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  ) {
    console.log('✉️ Mailer: Using configured SMTP server settings.');
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for port 465, false for 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // FALLBACK: Ethereal Email (Dev Mock)
  // If no email variables are in .env, we generate a mock testing inbox.
  // Ethereal captures our emails and gives us a browser URL to inspect them.
  console.log('✉️ Mailer: SMTP variables missing. Creating an Ethereal developer test mail account...');
  const testAccount = await nodemailer.createTestAccount();
  
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false, // Ethereal uses TLS on port 587
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
};

/**
 * Send Email Notification Helper
 * @param {Object} options - Email options (to, subject, text, html)
 */
const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const transporter = await createTransporter();
    
    const info = await transporter.sendMail({
      from: '"NGO Grant Tracker" <no-reply@ngogranttracker.org>',
      to,
      subject,
      text,
      html,
    });

    console.log(`✉️ Mail sent successfully. Message ID: ${info.messageId}`);

    // If using the Ethereal dev mock, get the browser preview link and log it!
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`🔗 Email Preview Link (Ctrl+Click to view): ${previewUrl}`);
      // Return the preview URL so we can output it in our controller API responses for testing!
      return { messageId: info.messageId, previewUrl };
    }

    return { messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to dispatch email notification:', error.message);
    return null;
  }
};

module.exports = { sendEmail };
