// ─── Email service port ────────────────────────────────────────────────────

export type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

export interface IEmailService {
  /** Send a single email. Returns true if successful. */
  send(payload: EmailPayload): Promise<boolean>;

  /** Send a booking confirmation email */
  sendBookingConfirmation(userEmail: string, bookingDetails: {
    clubName: string;
    courtName: string;
    date: string;
    time: string;
    duration: number;
  }): Promise<boolean>;

  /** Send a cancellation notification */
  sendCancellationNotice(userEmail: string, bookingDetails: {
    clubName: string;
    courtName: string;
    date: string;
    time: string;
  }): Promise<boolean>;
}
