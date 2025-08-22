import { LegalCase, Property, Tenant, Profile } from "@/types";
import dayjs from "dayjs";

export interface EmailTemplate {
  subject: string;
  htmlContent: string;
  textContent: string;
}

export interface EmailNotification {
  to: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  type:
    | "case_created"
    | "case_status_updated"
    | "payment_reminder"
    | "document_ready"
    | "court_date_reminder";
  metadata?: Record<string, unknown>;
}

export class EmailService {
  private static baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Email template generators
  static generateCaseCreatedTemplate(
    legalCase: LegalCase,
    property: Property,
    tenant: Tenant,
    landlord: Profile
  ): EmailTemplate {
    const subject = `New Legal Case Created - ${legalCase.case_type} for ${property.address}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .case-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
            .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Legal Case Created</h1>
            </div>
            <div class="content">
              <p>Hello ${landlord.name},</p>
              <p>A new legal case has been created in your Eviction Tracker account.</p>
              
              <div class="case-details">
                <h3>Case Details</h3>
                <ul>
                  <li><strong>Case Type:</strong> ${
                    legalCase.case_type === "FTPR"
                      ? "Failure to Pay Rent"
                      : legalCase.case_type
                  }</li>
                  <li><strong>Property:</strong> ${property.address}${
      property.unit ? `, Unit ${property.unit}` : ""
    }</li>
                  <li><strong>Tenant:</strong> ${tenant.tenant_names.join(
                    ", "
                  )}</li>
                  <li><strong>Date Initiated:</strong> ${dayjs(
                    legalCase.date_initiated
                  ).format("MMMM D, YYYY")}</li>
                  <li><strong>Amount Owed:</strong> $${(
                    legalCase.current_rent_owed / 100
                  ).toFixed(2)}</li>
                  <li><strong>Processing Fee:</strong> $${(
                    legalCase.price / 100
                  ).toFixed(2)}</li>
                </ul>
              </div>
              
              <p>Next steps:</p>
              <ul>
                <li>Review the case details</li>
                <li>Generate required documents</li>
                <li>Submit to the court when ready</li>
              </ul>
              
              <a href="${this.baseUrl}/dashboard/cases/${
      legalCase.id
    }" class="button">View Case Details</a>
            </div>
            <div class="footer">
              <p>This email was sent from Eviction Tracker. If you have any questions, please contact support.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const textContent = `
New Legal Case Created

Hello ${landlord.name},

A new legal case has been created in your Eviction Tracker account.

Case Details:
- Case Type: ${
      legalCase.case_type === "FTPR"
        ? "Failure to Pay Rent"
        : legalCase.case_type
    }
- Property: ${property.address}${property.unit ? `, Unit ${property.unit}` : ""}
- Tenant: ${tenant.tenant_names.join(", ")}
- Date Initiated: ${dayjs(legalCase.date_initiated).format("MMMM D, YYYY")}
- Amount Owed: $${(legalCase.current_rent_owed / 100).toFixed(2)}
- Processing Fee: $${(legalCase.price / 100).toFixed(2)}

Next steps:
- Review the case details
- Generate required documents
- Submit to the court when ready

View case details: ${this.baseUrl}/dashboard/cases/${legalCase.id}

This email was sent from Eviction Tracker.
    `;

    return { subject, htmlContent, textContent };
  }

  static generateCaseStatusUpdatedTemplate(
    legalCase: LegalCase,
    property: Property,
    tenant: Tenant,
    landlord: Profile,
    oldStatus: string,
    newStatus: string
  ): EmailTemplate {
    const subject = `Case Status Updated - ${property.address}`;

    const statusMessages = {
      NOTICE_DRAFT: "Notice is being prepared",
      SUBMITTED: "Case has been submitted to the court",
      IN_PROGRESS: "Case is proceeding through the court system",
      COMPLETE: "Case has been completed and resolved",
      CANCELLED: "Case has been cancelled or dismissed",
    };

    const getStatusMessage = (status: string) =>
      statusMessages[status as keyof typeof statusMessages] || status;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10b981; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .status-update { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #10b981; }
            .case-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
            .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Case Status Updated</h1>
            </div>
            <div class="content">
              <p>Hello ${landlord.name},</p>
              <p>The status of your legal case has been updated.</p>
              
              <div class="status-update">
                <h3>Status Change</h3>
                <p><strong>From:</strong> ${oldStatus.replace("_", " ")}</p>
                <p><strong>To:</strong> ${newStatus.replace("_", " ")}</p>
                <p><em>${getStatusMessage(newStatus)}</em></p>
              </div>
              
              <div class="case-details">
                <h3>Case Information</h3>
                <ul>
                  <li><strong>Property:</strong> ${property.address}${
      property.unit ? `, Unit ${property.unit}` : ""
    }</li>
                  <li><strong>Tenant:</strong> ${tenant.tenant_names.join(
                    ", "
                  )}</li>
                  <li><strong>Case Type:</strong> ${
                    legalCase.case_type === "FTPR"
                      ? "Failure to Pay Rent"
                      : legalCase.case_type
                  }</li>
                  <li><strong>Updated:</strong> ${dayjs().format(
                    "MMMM D, YYYY h:mm A"
                  )}</li>
                </ul>
              </div>
              
              <a href="${this.baseUrl}/dashboard/cases/${
      legalCase.id
    }" class="button">View Case Details</a>
            </div>
            <div class="footer">
              <p>This email was sent from Eviction Tracker. If you have any questions, please contact support.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const textContent = `
Case Status Updated

Hello ${landlord.name},

The status of your legal case has been updated.

Status Change:
From: ${oldStatus.replace("_", " ")}
To: ${newStatus.replace("_", " ")}
${getStatusMessage(newStatus)}

Case Information:
- Property: ${property.address}${property.unit ? `, Unit ${property.unit}` : ""}
- Tenant: ${tenant.tenant_names.join(", ")}
- Case Type: ${
      legalCase.case_type === "FTPR"
        ? "Failure to Pay Rent"
        : legalCase.case_type
    }
- Updated: ${dayjs().format("MMMM D, YYYY h:mm A")}

View case details: ${this.baseUrl}/dashboard/cases/${legalCase.id}

This email was sent from Eviction Tracker.
    `;

    return { subject, htmlContent, textContent };
  }

  static generatePaymentReminderTemplate(
    legalCase: LegalCase,
    property: Property,
    tenant: Tenant,
    landlord: Profile
  ): EmailTemplate {
    const subject = `Payment Reminder - Case Processing Fee Due`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .payment-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #f59e0b; }
            .case-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
            .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Payment Reminder</h1>
            </div>
            <div class="content">
              <p>Hello ${landlord.name},</p>
              <p>This is a reminder that payment is due for your legal case processing fee.</p>
              
              <div class="payment-details">
                <h3>Payment Information</h3>
                <ul>
                  <li><strong>Amount Due:</strong> $${(
                    legalCase.price / 100
                  ).toFixed(2)}</li>
                  <li><strong>Payment Status:</strong> ${
                    legalCase.payment_status
                  }</li>
                  <li><strong>Due Date:</strong> Immediate</li>
                </ul>
              </div>
              
              <div class="case-details">
                <h3>Case Information</h3>
                <ul>
                  <li><strong>Property:</strong> ${property.address}${
      property.unit ? `, Unit ${property.unit}` : ""
    }</li>
                  <li><strong>Tenant:</strong> ${tenant.tenant_names.join(
                    ", "
                  )}</li>
                  <li><strong>Case Type:</strong> ${
                    legalCase.case_type === "FTPR"
                      ? "Failure to Pay Rent"
                      : legalCase.case_type
                  }</li>
                </ul>
              </div>
              
              <p>Please complete your payment to proceed with the legal case.</p>
              
              <a href="${this.baseUrl}/dashboard/cases/${
      legalCase.id
    }" class="button">Make Payment</a>
            </div>
            <div class="footer">
              <p>This email was sent from Eviction Tracker. If you have any questions, please contact support.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const textContent = `
Payment Reminder

Hello ${landlord.name},

This is a reminder that payment is due for your legal case processing fee.

Payment Information:
- Amount Due: $${(legalCase.price / 100).toFixed(2)}
- Payment Status: ${legalCase.payment_status}
- Due Date: Immediate

Case Information:
- Property: ${property.address}${property.unit ? `, Unit ${property.unit}` : ""}
- Tenant: ${tenant.tenant_names.join(", ")}
- Case Type: ${
      legalCase.case_type === "FTPR"
        ? "Failure to Pay Rent"
        : legalCase.case_type
    }

Please complete your payment to proceed with the legal case.

Make payment: ${this.baseUrl}/dashboard/cases/${legalCase.id}

This email was sent from Eviction Tracker.
    `;

    return { subject, htmlContent, textContent };
  }

  static generateCourtDateReminderTemplate(
    legalCase: LegalCase,
    property: Property,
    tenant: Tenant,
    landlord: Profile,
    courtDate: string,
    reminderType: "trial" | "hearing"
  ): EmailTemplate {
    const dateLabel = reminderType === "trial" ? "Trial Date" : "Court Hearing";
    const subject = `${dateLabel} Reminder - ${dayjs(courtDate).format(
      "MMMM D, YYYY"
    )}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .court-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #dc2626; }
            .case-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
            .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${dateLabel} Reminder</h1>
            </div>
            <div class="content">
              <p>Hello ${landlord.name},</p>
              <p>This is a reminder about your upcoming court ${reminderType}.</p>
              
              <div class="court-details">
                <h3>Court Information</h3>
                <ul>
                  <li><strong>${dateLabel}:</strong> ${dayjs(courtDate).format(
      "MMMM D, YYYY"
    )}</li>
                  <li><strong>Time:</strong> Please check court records for specific time</li>
                  <li><strong>County:</strong> ${
                    property.county
                  } County, Maryland</li>
                </ul>
              </div>
              
              <div class="case-details">
                <h3>Case Information</h3>
                <ul>
                  <li><strong>Property:</strong> ${property.address}${
      property.unit ? `, Unit ${property.unit}` : ""
    }</li>
                  <li><strong>Tenant:</strong> ${tenant.tenant_names.join(
                    ", "
                  )}</li>
                  <li><strong>Case Type:</strong> ${
                    legalCase.case_type === "FTPR"
                      ? "Failure to Pay Rent"
                      : legalCase.case_type
                  }</li>
                  ${
                    legalCase.court_case_number
                      ? `<li><strong>Court Case Number:</strong> ${legalCase.court_case_number}</li>`
                      : ""
                  }
                </ul>
              </div>
              
              <p><strong>Important reminders:</strong></p>
              <ul>
                <li>Arrive at court early</li>
                <li>Bring all relevant documents</li>
                <li>Dress professionally</li>
                <li>Contact your attorney if you have one</li>
              </ul>
              
              <a href="${this.baseUrl}/dashboard/cases/${
      legalCase.id
    }" class="button">View Case Details</a>
            </div>
            <div class="footer">
              <p>This email was sent from Eviction Tracker. If you have any questions, please contact support.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const textContent = `
${dateLabel} Reminder

Hello ${landlord.name},

This is a reminder about your upcoming court ${reminderType}.

Court Information:
- ${dateLabel}: ${dayjs(courtDate).format("MMMM D, YYYY")}
- Time: Please check court records for specific time
- County: ${property.county} County, Maryland

Case Information:
- Property: ${property.address}${property.unit ? `, Unit ${property.unit}` : ""}
- Tenant: ${tenant.tenant_names.join(", ")}
- Case Type: ${
      legalCase.case_type === "FTPR"
        ? "Failure to Pay Rent"
        : legalCase.case_type
    }
${
  legalCase.court_case_number
    ? `- Court Case Number: ${legalCase.court_case_number}`
    : ""
}

Important reminders:
- Arrive at court early
- Bring all relevant documents
- Dress professionally
- Contact your attorney if you have one

View case details: ${this.baseUrl}/dashboard/cases/${legalCase.id}

This email was sent from Eviction Tracker.
    `;

    return { subject, htmlContent, textContent };
  }

  // Queue email for sending (in a real implementation, this would integrate with an email service)
  static async queueEmail(
    notification: EmailNotification
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // In a real implementation, this would:
      // 1. Store the email in a queue (database table)
      // 2. Send to an email service like SendGrid, AWS SES, or Resend
      // 3. Handle delivery tracking and retries

      console.log("Email Notification Queued:", {
        to: notification.to,
        subject: notification.subject,
        type: notification.type,
        timestamp: new Date().toISOString(),
      });

      // For development, we'll just log the email content
      if (process.env.NODE_ENV === "development") {
        console.log("Email Content Preview:");
        console.log("Subject:", notification.subject);
        console.log("Text Content:", notification.textContent);
      }

      return { success: true };
    } catch (error) {
      console.error("Failed to queue email:", error);
      return { success: false, error: "Failed to queue email notification" };
    }
  }

  // High-level notification methods
  static async sendCaseCreatedNotification(
    legalCase: LegalCase,
    property: Property,
    tenant: Tenant,
    landlord: Profile
  ): Promise<{ success: boolean; error?: string }> {
    const template = this.generateCaseCreatedTemplate(
      legalCase,
      property,
      tenant,
      landlord
    );

    const notification: EmailNotification = {
      to: landlord.email,
      subject: template.subject,
      htmlContent: template.htmlContent,
      textContent: template.textContent,
      type: "case_created",
      metadata: {
        caseId: legalCase.id,
        landlordId: landlord.id,
      },
    };

    return this.queueEmail(notification);
  }

  static async sendCaseStatusUpdateNotification(
    legalCase: LegalCase,
    property: Property,
    tenant: Tenant,
    landlord: Profile,
    oldStatus: string,
    newStatus: string
  ): Promise<{ success: boolean; error?: string }> {
    const template = this.generateCaseStatusUpdatedTemplate(
      legalCase,
      property,
      tenant,
      landlord,
      oldStatus,
      newStatus
    );

    const notification: EmailNotification = {
      to: landlord.email,
      subject: template.subject,
      htmlContent: template.htmlContent,
      textContent: template.textContent,
      type: "case_status_updated",
      metadata: {
        caseId: legalCase.id,
        landlordId: landlord.id,
        oldStatus,
        newStatus,
      },
    };

    return this.queueEmail(notification);
  }

  static async sendPaymentReminderNotification(
    legalCase: LegalCase,
    property: Property,
    tenant: Tenant,
    landlord: Profile
  ): Promise<{ success: boolean; error?: string }> {
    const template = this.generatePaymentReminderTemplate(
      legalCase,
      property,
      tenant,
      landlord
    );

    const notification: EmailNotification = {
      to: landlord.email,
      subject: template.subject,
      htmlContent: template.htmlContent,
      textContent: template.textContent,
      type: "payment_reminder",
      metadata: {
        caseId: legalCase.id,
        landlordId: landlord.id,
      },
    };

    return this.queueEmail(notification);
  }

  static async sendCourtDateReminderNotification(
    legalCase: LegalCase,
    property: Property,
    tenant: Tenant,
    landlord: Profile,
    courtDate: string,
    reminderType: "trial" | "hearing"
  ): Promise<{ success: boolean; error?: string }> {
    const template = this.generateCourtDateReminderTemplate(
      legalCase,
      property,
      tenant,
      landlord,
      courtDate,
      reminderType
    );

    const notification: EmailNotification = {
      to: landlord.email,
      subject: template.subject,
      htmlContent: template.htmlContent,
      textContent: template.textContent,
      type: "court_date_reminder",
      metadata: {
        caseId: legalCase.id,
        landlordId: landlord.id,
        courtDate,
        reminderType,
      },
    };

    return this.queueEmail(notification);
  }
}
