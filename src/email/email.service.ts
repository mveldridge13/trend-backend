import { Injectable, Logger } from "@nestjs/common";
import { Resend } from "resend";
import { SecretsService } from "../common/services/secrets.service";

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend | null = null;
  private readonly appName = "Trend";

  constructor(private readonly secretsService: SecretsService) {}

  private getResendClient(): Resend {
    if (!this.resend) {
      const apiKey = this.secretsService.get("RESEND_API_KEY");
      this.resend = new Resend(apiKey);
    }
    return this.resend;
  }

  private getFromEmail(): string {
    return this.secretsService.get("EMAIL_FROM") || "Trend <noreply@trendapp.co>";
  }

  // Extracts just the address portion (e.g. "noreply@trendapp.co") from the
  // configured EMAIL_FROM, which may be in "Name <addr>" form. Used to send
  // invoices from the verified app domain while overriding the display name
  // with the freelancer's name.
  private getFromEmailAddress(): string {
    const from = this.getFromEmail();
    const match = from.match(/<([^>]+)>/);
    return match ? match[1] : from;
  }

  async sendPasswordResetEmail(
    toEmail: string,
    resetToken: string,
    firstName: string,
  ): Promise<boolean> {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const subject = `Reset your ${this.appName} password`;
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>Hi ${firstName},</p>
        <p>We received a request to reset your ${this.appName} password.</p>
        <p>Click the button below to reset your password. This link expires in 1 hour.</p>
        <p style="margin: 30px 0;">
          <a href="${resetUrl}"
             style="background-color: #4F46E5; color: white; padding: 12px 24px;
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
        </p>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <p>For security, this link will expire in 1 hour.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          This email was sent by ${this.appName}. If you have questions, contact support.
        </p>
      </div>
    `;
    const textBody = `
Hi ${firstName},

We received a request to reset your ${this.appName} password.

Click the link below to reset your password (expires in 1 hour):
${resetUrl}

If you didn't request this, you can safely ignore this email.

- The ${this.appName} Team
    `;

    return this.sendEmail(toEmail, subject, htmlBody, textBody);
  }

  async sendPasswordChangedEmail(
    toEmail: string,
    firstName: string,
  ): Promise<boolean> {
    const subject = `Your ${this.appName} password was changed`;
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Changed</h2>
        <p>Hi ${firstName},</p>
        <p>Your ${this.appName} password was successfully changed.</p>
        <p>If you didn't make this change, please contact support immediately and reset your password.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          This email was sent by ${this.appName}.
        </p>
      </div>
    `;
    const textBody = `
Hi ${firstName},

Your ${this.appName} password was successfully changed.

If you didn't make this change, please contact support immediately and reset your password.

- The ${this.appName} Team
    `;

    return this.sendEmail(toEmail, subject, htmlBody, textBody);
  }

  async sendInvoiceEmail(
    toEmail: string,
    params: {
      invoiceNumber: string;
      senderName: string;
      replyTo: string;
      total: string;
      dueDate: string;
      pdf: Buffer;
    },
  ): Promise<boolean> {
    const subject = `Invoice ${params.invoiceNumber} from ${params.senderName}`;

    // Industry-standard invoice delivery: send from the verified app domain,
    // but show the freelancer's name and route replies back to them. Strip
    // header-breaking characters from the display name.
    const safeName =
      params.senderName.replace(/[\r\n"<>\\]/g, "").trim() || this.appName;
    // Quote the display name so commas (e.g. "Acme, Inc") aren't parsed as an
    // address separator in the From header.
    const from = `"${safeName}" <${this.getFromEmailAddress()}>`;
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Invoice ${params.invoiceNumber}</h2>
        <p>Hi,</p>
        <p>${params.senderName} has sent you an invoice for <strong>${params.total}</strong>, due ${params.dueDate}.</p>
        <p>The full invoice is attached to this email as a PDF.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          This invoice was sent via ${this.appName}.
        </p>
      </div>
    `;
    const textBody = `Invoice ${params.invoiceNumber}

${params.senderName} has sent you an invoice for ${params.total}, due ${params.dueDate}.

The full invoice is attached to this email as a PDF.
    `;

    return this.sendEmail(
      toEmail,
      subject,
      htmlBody,
      textBody,
      [
        {
          filename: `invoice-${params.invoiceNumber}.pdf`,
          content: params.pdf,
        },
      ],
      { from, replyTo: params.replyTo },
    );
  }

  private async sendEmail(
    toEmail: string,
    subject: string,
    htmlBody: string,
    textBody: string,
    attachments?: { filename: string; content: Buffer }[],
    options?: { from?: string; replyTo?: string },
  ): Promise<boolean> {
    const apiKey = this.secretsService.get("RESEND_API_KEY");

    // Skip sending in development if Resend is not configured
    if (!apiKey && process.env.NODE_ENV !== "production") {
      this.logger.warn(`[DEV] Would send email to ${toEmail}: ${subject}`);
      return true;
    }

    try {
      const { error } = await this.getResendClient().emails.send({
        from: options?.from || this.getFromEmail(),
        to: toEmail,
        subject,
        html: htmlBody,
        text: textBody,
        ...(attachments?.length ? { attachments } : {}),
        ...(options?.replyTo ? { replyTo: options.replyTo } : {}),
      });

      if (error) {
        this.logger.error(`Failed to send email to ${toEmail}:`, error);
        return false;
      }

      this.logger.log(`Email sent to ${toEmail}: ${subject}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${toEmail}:`, error);
      return false;
    }
  }
}
