"""
Notification service — sends OTP via email (Gmail SMTP) and/or SMS (Twilio).

Delivery rules:
  - Email is always attempted if SMTP_USER is configured.
  - SMS is attempted if TWILIO_ACCOUNT_SID is configured AND a phone number is provided.
  - Both can be active simultaneously (belt + suspenders).
  - Failures are logged but never crash the registration flow.
"""

import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings

logger = logging.getLogger(__name__)


# ── Email ─────────────────────────────────────────────────────────────────────

_EMAIL_HTML = """
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:40px 16px;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
    <div style="background:#1e40af;padding:28px 32px;">
      <p style="color:#fff;font-size:22px;font-weight:700;margin:0;">Halisi</p>
      <p style="color:#bfdbfe;font-size:13px;margin:4px 0 0;">Cross-Border Payments</p>
    </div>
    <div style="padding:32px;">
      <h2 style="color:#1e293b;font-size:20px;margin:0 0 8px;">Your verification code</h2>
      <p style="color:#64748b;font-size:14px;margin:0 0 28px;">Enter this code in the app to verify your account. It expires in 10 minutes.</p>
      <div style="background:#f1f5f9;border-radius:12px;text-align:center;padding:24px;">
        <span style="font-size:40px;font-weight:800;letter-spacing:10px;color:#1e40af;font-family:monospace;">{otp}</span>
      </div>
      <p style="color:#94a3b8;font-size:12px;margin:20px 0 0;text-align:center;">
        If you didn't request this, please ignore this email.<br>
        Never share this code with anyone.
      </p>
    </div>
    <div style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;">
      <p style="color:#cbd5e1;font-size:11px;margin:0;text-align:center;">Halisi &copy; {year} · Secure cross-border payments</p>
    </div>
  </div>
</body>
</html>
"""


def send_otp_email(to_email: str, otp: str, full_name: str = "") -> bool:
    """Send OTP via Gmail SMTP. Returns True on success."""
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning("Email OTP skipped — SMTP_USER/SMTP_PASSWORD not configured")
        return False

    from datetime import datetime
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"{otp} is your Halisi verification code"
        msg["From"] = f"{settings.EMAIL_FROM_NAME} <{settings.SMTP_USER}>"
        msg["To"] = to_email

        greeting = f"Hi {full_name}," if full_name else "Hi,"
        text_body = (
            f"{greeting}\n\n"
            f"Your Halisi verification code is: {otp}\n\n"
            f"This code expires in 10 minutes. Never share it with anyone.\n\n"
            f"— Halisi Team"
        )
        html_body = _EMAIL_HTML.format(otp=otp, year=datetime.utcnow().year)

        msg.attach(MIMEText(text_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_USER, to_email, msg.as_string())

        logger.info("OTP email sent to %s", to_email)
        return True

    except smtplib.SMTPAuthenticationError:
        logger.error(
            "SMTP authentication failed. Make sure you're using a Gmail App Password, "
            "not your regular Gmail password. Enable 2FA and generate an App Password at "
            "https://myaccount.google.com/apppasswords"
        )
        return False
    except Exception as exc:
        logger.error("Failed to send OTP email to %s: %s", to_email, exc)
        return False


# ── SMS (Africa's Talking) ────────────────────────────────────────────────────

def send_otp_sms(to_phone: str, otp: str) -> bool:
    """Send OTP via Africa's Talking SMS. Returns True on success."""
    if not settings.AT_USERNAME or not settings.AT_API_KEY:
        logger.warning("SMS OTP skipped — AT_USERNAME/AT_API_KEY not configured")
        return False

    try:
        import africastalking
        africastalking.initialize(settings.AT_USERNAME, settings.AT_API_KEY)
        sms = africastalking.SMS

        # Sandbox doesn't support custom sender IDs — only use in production
        sender = None if settings.AT_USERNAME.lower() == "sandbox" else (settings.AT_SENDER_ID or None)
        response = sms.send(
            message=f"Your Halisi code is: {otp}. Expires in 10 min. Never share this.",
            recipients=[to_phone],
            sender_id=sender,
        )

        # Check response — AT returns a list of recipient results
        recipients = response.get("SMSMessageData", {}).get("Recipients", [])
        if recipients and recipients[0].get("status") == "Success":
            logger.info("OTP SMS sent to %s via Africa's Talking", to_phone)
            return True
        else:
            logger.error("AT SMS delivery issue for %s: %s", to_phone, response)
            return False

    except Exception as exc:
        logger.error("Failed to send OTP SMS to %s: %s", to_phone, exc)
        return False


# ── Transfer notifications ────────────────────────────────────────────────────

_TRANSFER_COMPLETED_HTML = """
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:40px 16px;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
    <div style="background:#15803d;padding:28px 32px;">
      <p style="color:#fff;font-size:22px;font-weight:700;margin:0;">Halisi</p>
      <p style="color:#bbf7d0;font-size:13px;margin:4px 0 0;">Transfer Completed</p>
    </div>
    <div style="padding:32px;">
      <h2 style="color:#1e293b;font-size:20px;margin:0 0 8px;">Money sent successfully!</h2>
      <p style="color:#64748b;font-size:14px;margin:0 0 24px;">Hi {name}, your transfer has been completed.</p>
      <div style="background:#f0fdf4;border-radius:12px;padding:20px;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="color:#64748b;padding:6px 0;">Transfer ID</td><td style="text-align:right;font-weight:700;color:#1e293b;">#{transfer_id}</td></tr>
          <tr><td style="color:#64748b;padding:6px 0;">You sent</td><td style="text-align:right;font-weight:700;color:#1e293b;">{send_amount} {send_currency}</td></tr>
          <tr><td style="color:#64748b;padding:6px 0;">Recipient receives</td><td style="text-align:right;font-weight:700;color:#15803d;">{receive_amount} {receive_currency}</td></tr>
          <tr><td style="color:#64748b;padding:6px 0;">Recipient</td><td style="text-align:right;font-weight:700;color:#1e293b;">{recipient_name}</td></tr>
          <tr><td style="color:#64748b;padding:6px 0;">Reference</td><td style="text-align:right;font-weight:700;color:#1e293b;">{reference}</td></tr>
        </table>
      </div>
      <p style="color:#94a3b8;font-size:12px;margin:20px 0 0;text-align:center;">
        Thank you for using Halisi. Keep your reference number for your records.
      </p>
    </div>
    <div style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;">
      <p style="color:#cbd5e1;font-size:11px;margin:0;text-align:center;">Halisi &copy; {year} · Secure cross-border payments</p>
    </div>
  </div>
</body>
</html>
"""

_TRANSFER_FAILED_HTML = """
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:40px 16px;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
    <div style="background:#b91c1c;padding:28px 32px;">
      <p style="color:#fff;font-size:22px;font-weight:700;margin:0;">Halisi</p>
      <p style="color:#fecaca;font-size:13px;margin:4px 0 0;">Transfer Failed</p>
    </div>
    <div style="padding:32px;">
      <h2 style="color:#1e293b;font-size:20px;margin:0 0 8px;">Transfer could not be completed</h2>
      <p style="color:#64748b;font-size:14px;margin:0 0 24px;">Hi {name}, unfortunately your transfer failed. Your funds have been refunded to your wallet.</p>
      <div style="background:#fef2f2;border-radius:12px;padding:20px;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="color:#64748b;padding:6px 0;">Transfer ID</td><td style="text-align:right;font-weight:700;color:#1e293b;">#{transfer_id}</td></tr>
          <tr><td style="color:#64748b;padding:6px 0;">Amount</td><td style="text-align:right;font-weight:700;color:#1e293b;">{send_amount} {send_currency}</td></tr>
          <tr><td style="color:#64748b;padding:6px 0;">Reason</td><td style="text-align:right;font-weight:700;color:#b91c1c;">{reason}</td></tr>
        </table>
      </div>
      <p style="color:#94a3b8;font-size:12px;margin:20px 0 0;text-align:center;">
        Your balance has been restored. Please try again or contact support if the issue persists.
      </p>
    </div>
    <div style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;">
      <p style="color:#cbd5e1;font-size:11px;margin:0;text-align:center;">Halisi &copy; {year} · Secure cross-border payments</p>
    </div>
  </div>
</body>
</html>
"""


def send_transfer_completed_email(
    to_email: str,
    full_name: str,
    transfer_id: int,
    send_amount: str,
    send_currency: str,
    receive_amount: str,
    receive_currency: str,
    recipient_name: str,
    reference: str,
) -> bool:
    """Send transfer-completed notification via Gmail SMTP. Returns True on success."""
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        return False

    from datetime import datetime
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Halisi: Transfer #{transfer_id} completed"
        msg["From"] = f"{settings.EMAIL_FROM_NAME} <{settings.SMTP_USER}>"
        msg["To"] = to_email

        text_body = (
            f"Hi {full_name},\n\n"
            f"Your transfer has been completed.\n\n"
            f"Transfer ID: #{transfer_id}\n"
            f"You sent: {send_amount} {send_currency}\n"
            f"Recipient receives: {receive_amount} {receive_currency}\n"
            f"Recipient: {recipient_name}\n"
            f"Reference: {reference}\n\n"
            f"Thank you for using Halisi.\n— Halisi Team"
        )
        html_body = _TRANSFER_COMPLETED_HTML.format(
            name=full_name,
            transfer_id=transfer_id,
            send_amount=send_amount,
            send_currency=send_currency,
            receive_amount=receive_amount,
            receive_currency=receive_currency,
            recipient_name=recipient_name,
            reference=reference,
            year=datetime.utcnow().year,
        )

        msg.attach(MIMEText(text_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_USER, to_email, msg.as_string())

        logger.info("Transfer-completed email sent to %s (transfer #%s)", to_email, transfer_id)
        return True

    except Exception as exc:
        logger.error("Failed to send transfer-completed email to %s: %s", to_email, exc)
        return False


def send_transfer_failed_email(
    to_email: str,
    full_name: str,
    transfer_id: int,
    send_amount: str,
    send_currency: str,
    reason: str,
) -> bool:
    """Send transfer-failed notification via Gmail SMTP. Returns True on success."""
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        return False

    from datetime import datetime
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Halisi: Transfer #{transfer_id} failed"
        msg["From"] = f"{settings.EMAIL_FROM_NAME} <{settings.SMTP_USER}>"
        msg["To"] = to_email

        text_body = (
            f"Hi {full_name},\n\n"
            f"Unfortunately your transfer could not be completed. "
            f"Your funds have been refunded to your wallet.\n\n"
            f"Transfer ID: #{transfer_id}\n"
            f"Amount: {send_amount} {send_currency}\n"
            f"Reason: {reason}\n\n"
            f"Please try again or contact support if the issue persists.\n— Halisi Team"
        )
        html_body = _TRANSFER_FAILED_HTML.format(
            name=full_name,
            transfer_id=transfer_id,
            send_amount=send_amount,
            send_currency=send_currency,
            reason=reason,
            year=datetime.utcnow().year,
        )

        msg.attach(MIMEText(text_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_USER, to_email, msg.as_string())

        logger.info("Transfer-failed email sent to %s (transfer #%s)", to_email, transfer_id)
        return True

    except Exception as exc:
        logger.error("Failed to send transfer-failed email to %s: %s", to_email, exc)
        return False


def dispatch_transfer_completed(
    email: str,
    full_name: str,
    phone: str | None,
    transfer_id: int,
    send_amount: str,
    send_currency: str,
    receive_amount: str,
    receive_currency: str,
    recipient_name: str,
    reference: str,
) -> None:
    """Fire-and-forget: send transfer-completed notifications on all available channels."""
    logger.info("Transfer #%s completed for %s", transfer_id, email)

    send_transfer_completed_email(
        to_email=email,
        full_name=full_name,
        transfer_id=transfer_id,
        send_amount=send_amount,
        send_currency=send_currency,
        receive_amount=receive_amount,
        receive_currency=receive_currency,
        recipient_name=recipient_name,
        reference=reference,
    )

    if phone and settings.AT_USERNAME and settings.AT_API_KEY:
        try:
            import africastalking
            africastalking.initialize(settings.AT_USERNAME, settings.AT_API_KEY)
            sender = None if settings.AT_USERNAME.lower() == "sandbox" else (settings.AT_SENDER_ID or None)
            africastalking.SMS.send(
                message=(
                    f"Halisi: Transfer #{transfer_id} completed. "
                    f"{recipient_name} receives {receive_amount} {receive_currency}. "
                    f"Ref: {reference}"
                ),
                recipients=[phone],
                sender_id=sender,
            )
            logger.info("Transfer-completed SMS sent to %s", phone)
        except Exception as exc:
            logger.error("Failed to send transfer-completed SMS to %s: %s", phone, exc)


def dispatch_transfer_failed(
    email: str,
    full_name: str,
    phone: str | None,
    transfer_id: int,
    send_amount: str,
    send_currency: str,
    reason: str,
) -> None:
    """Fire-and-forget: send transfer-failed notifications on all available channels."""
    logger.info("Transfer #%s failed for %s — reason: %s", transfer_id, email, reason)

    send_transfer_failed_email(
        to_email=email,
        full_name=full_name,
        transfer_id=transfer_id,
        send_amount=send_amount,
        send_currency=send_currency,
        reason=reason,
    )

    if phone and settings.AT_USERNAME and settings.AT_API_KEY:
        try:
            import africastalking
            africastalking.initialize(settings.AT_USERNAME, settings.AT_API_KEY)
            sender = None if settings.AT_USERNAME.lower() == "sandbox" else (settings.AT_SENDER_ID or None)
            africastalking.SMS.send(
                message=(
                    f"Halisi: Transfer #{transfer_id} failed. "
                    f"Reason: {reason}. "
                    f"Your funds have been refunded."
                ),
                recipients=[phone],
                sender_id=sender,
            )
            logger.info("Transfer-failed SMS sent to %s", phone)
        except Exception as exc:
            logger.error("Failed to send transfer-failed SMS to %s: %s", phone, exc)


# ── Combined dispatch ─────────────────────────────────────────────────────────

def dispatch_otp(email: str, otp: str, phone: str | None = None, full_name: str = "") -> dict:
    """
    Send OTP to all available channels.
    Returns a summary of what was sent.
    Always logs to console so OTP is visible in dev even without credentials.
    """
    logger.info("OTP for %s: %s", email, otp)  # dev fallback — always visible in logs
    print(f"\n{'='*50}\nOTP for {email}: {otp}\n{'='*50}\n")   # console output for dev

    email_sent = send_otp_email(email, otp, full_name)
    sms_sent = send_otp_sms(phone, otp) if phone else False

    channels = []
    if email_sent:
        channels.append("email")
    if sms_sent:
        channels.append("sms")
    if not channels:
        channels.append("console")  # dev mode

    return {"channels": channels, "email_sent": email_sent, "sms_sent": sms_sent}
