import nodemailer from "nodemailer";
import { EmailCredentials } from "../types/user";
import { environment } from "../config/environment";

// Email configuration
const emailConfig = {
  host: environment.nodemailer.host,
  port: environment.nodemailer.port,
  secure: environment.nodemailer.secure,
  auth: {
    user: environment.nodemailer.auth.user,
    pass: environment.nodemailer.auth.pass,
  },
};

// Create transporter
const transporter = nodemailer.createTransport(emailConfig);

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error("Email configuration error:", error);
  } else {
    console.log("Email server is ready to send messages");
  }
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const mailOptions = {
      from: `"${process.env.APP_NAME || "Shop Floor "}" <${
        emailConfig.auth.user
      }>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", result.messageId);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

export async function sendUserCredentials(
  credentials: EmailCredentials
): Promise<boolean> {
  const { email, password, first_name, last_name } = credentials;

  const subject = "Your Account Credentials - Shop Floor ";
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Account Credentials</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f4f4f4; padding: 20px; text-align: center; border-radius: 5px; }
        .content { padding: 20px; }
        .credentials { background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Shop Floor</h1>
        </div>
        <div class="content">
          <p>Hello ${first_name} ${last_name},</p>
          <p>Your account has been created successfully. Below are your login credentials:</p>
          
          <div class="credentials">
            <h3>Login Credentials</h3>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Password:</strong> ${password}</p>
          </div>
          
          <div class="warning">
            <h4>⚠️ Important Security Notice</h4>
            <p>For your security, please change your password after your first login.</p>
          </div>
          
          <p>You can now access the system using these credentials.</p>
          <p>If you have any questions, please contact the system administrator.</p>
        </div>
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Welcome to Shop Floor 
    
    Hello ${first_name} ${last_name},
    
    Your account has been created successfully. Below are your login credentials:
    
    Email: ${email}
    Password: ${password}
    
    Important Security Notice:
    For your security, please change your password after your first login.
    
    You can now access the system using these credentials.
    If you have any questions, please contact the system administrator.
    
    This is an automated message. Please do not reply to this email.
  `;

  return await sendEmail({
    to: email,
    subject,
    html,
    text,
  });
}

export async function sendPasswordResetLink(
  email: string,
  resetLink: string,
  firstName: string
): Promise<boolean> {
  const subject = "Password Reset Request - Shop Floor ";
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Password Reset</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f4f4f4; padding: 20px; text-align: center; border-radius: 5px; }
        .content { padding: 20px; }
        .button { display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hello ${firstName},</p>
          <p>We received a request to reset your password for your Shop Floor account.</p>
          
          <p>Click the button below to reset your password:</p>
          <a href="${resetLink}" class="button">Reset Password</a>
          
          <div class="warning">
            <h4>⚠️ Security Notice</h4>
            <p>This link will expire in 1 hour for security reasons.</p>
            <p>If you didn't request this password reset, please ignore this email.</p>
          </div>
          
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 3px;">${resetLink}</p>
        </div>
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Password Reset Request - Shop Floor 
    
    Hello ${firstName},
    
    We received a request to reset your password for your Shop Floor account.
    
    Click the link below to reset your password:
    ${resetLink}
    
    Security Notice:
    This link will expire in 1 hour for security reasons.
    If you didn't request this password reset, please ignore this email.
    
    This is an automated message. Please do not reply to this email.
  `;

  return await sendEmail({
    to: email,
    subject,
    html,
    text,
  });
}
