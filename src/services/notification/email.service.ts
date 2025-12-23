import { config } from "@/config";
import { ExternalServiceError } from "@/util/errors";
import { logger } from "@/util/logger";
import nodemailer from "nodemailer";
import path from "path";
import fs from "fs/promises";
import { templateEngine } from "@/util/templateEngine";

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransport();
  }

  private initializeTransport(): void {
    if (config.email.user && config.email.password) {
      try {
        this.transporter = nodemailer.createTransport({
          host: config.email.host,
          port: config.email.port,
          secure: config.email.secure,
          auth: {
            user: config.email.user,
            pass: config.email.password,
          },
          debug: config.env === "development",
          logger: config.env === "development",
        });

        // verify connection

        this.transporter.verify((error, success) => {
          if (error) {
            logger.error("SMTP connection failed", {
              error: error.message,
              code: (error as any).code,
            });
          } else {
            logger.info("SMTP connection established");
          }
        });
      } catch (error) {
        logger.error("Error initializing SMTP transport", error);
      }
    } else {
      logger.warn("SMTP credentials are not configured", {
        hasUser: !!config.email.user,
        hasPassword: !!config.email.password,
      });
    }
  }

  //   Ensure transport is configured

  private ensureTransporter(): void {
    if (!this.transporter) {
      logger.warn(
        "Email transport not initialized, please check SMTP credentials"
      );
      throw new ExternalServiceError(
        "Email Service",
        "SMTP transport is not initialized"
      );
    }
  }

  //   Wrap email content in base layout

  private async wrapInLayout(content: string): Promise<string> {
    const layoutPath = path.join(
      process.cwd(),
      "src/templates/emails/layout/base.html"
    );
    const layout = await fs.readFile(layoutPath, "utf-8");
    return layout.replace("{{content}}", content);
  }

  private async sendTemplateEmail(
    to: string,
    subject: string,
    templateName: string,
    data: Record<string, any>
  ): Promise<void> {
    this.ensureTransporter();

    logger.info(
      `Sending email to ${to} with subject ${subject} and template ${templateName}`,
      {
        to,
        subject,
        templateName,
        data,
      }
    );

    // render HTML and text templates

    // render HTML template

    const htmlContent = await templateEngine.render(templateName, data);
    const html = await this.wrapInLayout(htmlContent);
    const text = await templateEngine.renderText(templateName, data);

    logger.info(`Rendered HTML template for ${templateName}`, {
      html,
      text,
    });

    const mailOptions = {
      from: `" Headshot Generator" <${config.email.from}>`,
      to,
      subject,
      html,
      text,
    };

    logger.info(`Sending email with options`, {
      mailOptions,
    });

    try {
      const result = await this.transporter!.sendMail(mailOptions);

      logger.info(`Email sent successfully`, {
        result,
      });

      //
      if (result.rejected && result.rejected.length > 0) {
        logger.warn(`Email rejected`, {
          to,
          rejected: result.rejected,
          response: result.response,
        });
      }
    } catch (error: any) {
      logger.error("Failed to send email", {
        to,
        subject,
        template: templateName,
        error: error.message,
        code: error.code,
        command: error.command,
        response: error.response,
        responseCode: error.responseCode,
        stack: error.stack,
      });
      throw error;
    }
  }

  async sendVerificationEmail(email: string, name: string | undefined, token: string): Promise<void> {

    const verifctaionUrl = `${config.frontendUrl}/verify-email?token=${token}`;

    await this.sendTemplateEmail(email,'Varify Your Email Address', 'verification', {
        name: name || '',
        verificationUrl: verifctaionUrl,
    })
  }

  async sendPaymentSuccessEmail(
    email: string,
    name: string | undefined,
    orderId: string,
    amount: number,
    credits: number,
    newBalance: number
  ): Promise<void> {
    const dashboardUrl = `${config.frontendUrl}/dashboard/credits`;
    
    await this.sendTemplateEmail(
      email,
      'Payment Successful - Credits Added',
      'payment-success',
      {
        name: name || 'there',
        orderId,
        amount: amount.toFixed(2),
        credits,
        newBalance,
        dashboardUrl,
      }
    );
  }

}



export const emailService = new EmailService();