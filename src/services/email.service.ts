import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Email service for sending verification emails
 */
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Create a nodemailer transporter
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  /**
   * Send a verification email to a user
   * @param to Recipient email
   * @param token Verification token
   * @param name User's name
   */
  public async sendVerificationEmail(to: string, token: string, name: string): Promise<void> {
    const appUrl = process.env.APP_URL || 'http://localhost:5000';
    const verificationUrl = `${appUrl}/api/auth/verify/${token}`;
    
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Paza App'}" <${process.env.EMAIL_FROM || 'noreply@paza.app'}>`,
      to,
      subject: 'Verify Your Email Address',
      text: `Hello ${name},\n\nPlease verify your email address by clicking the link below:\n\n${verificationUrl}\n\nIf you did not request this, please ignore this email.\n\nThank you,\nThe Paza Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Verify Your Email Address</h2>
          <p>Hello ${name},</p>
          <p>Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email Address</a>
          </div>
          <p>Or copy and paste the following link in your browser:</p>
          <p><a href="${verificationUrl}">${verificationUrl}</a></p>
          <p>If you did not request this, please ignore this email.</p>
          <p>Thank you,<br>The Paza Team</p>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw new Error('Failed to send verification email');
    }
  }

  /**
   * Send a password reset email to a user
   * @param to Recipient email
   * @param token Reset password token
   * @param name User's name
   */
  public async sendPasswordResetEmail(to: string, token: string, name: string): Promise<void> {
    const appUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${appUrl}/reset-password/${token}`;
    
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Paza App'}" <${process.env.EMAIL_FROM || 'noreply@paza.app'}>`,
      to,
      subject: 'Reset Your Password',
      text: `Hello ${name},\n\nYou requested a password reset. Please click on the link below to reset your password:\n\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you did not request this, please ignore this email and your password will remain unchanged.\n\nThank you,\nThe Paza Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Reset Your Password</h2>
          <p>Hello ${name},</p>
          <p>You requested a password reset. Please click on the button below to reset your password:</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
          </div>
          <p>Or copy and paste the following link in your browser:</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          <p>This link will expire in 1 hour.</p>
          <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
          <p>Thank you,<br>The Paza Team</p>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }
}

export default new EmailService();
