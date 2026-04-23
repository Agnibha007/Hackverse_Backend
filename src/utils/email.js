import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendOtpEmail(toEmail, otp) {
  await transporter.sendMail({
    from: `"Phi" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: "Your Phi verification code",
    html: `
      <div style="background:#0a0a0f;color:#fff;font-family:monospace;padding:40px;max-width:480px;margin:0 auto;border:1px solid #00eaff33;border-radius:12px;">
        <h1 style="color:#ff0080;letter-spacing:4px;font-size:20px;">PHI</h1>
        <p style="color:#aaa;font-size:13px;letter-spacing:2px;">AGENT VERIFICATION</p>
        <hr style="border-color:#00eaff22;margin:24px 0;" />
        <p style="color:#ccc;font-size:14px;">Your verification code is:</p>
        <div style="margin:24px 0;padding:20px;background:#1a1a2e;border:1px solid #ff008040;border-radius:8px;text-align:center;">
          <span style="font-size:36px;font-weight:bold;letter-spacing:12px;color:#ff0080;">${otp}</span>
        </div>
        <p style="color:#aaa;font-size:13px;">Enter this code on the verification screen. It expires in <strong style="color:#fff;">10 minutes</strong>.</p>
        <p style="color:#555;font-size:11px;margin-top:32px;">If you didn't create an account, ignore this email.</p>
      </div>
    `,
  });
}
