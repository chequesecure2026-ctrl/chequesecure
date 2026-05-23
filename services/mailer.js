const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function sendAcknowledgmentEmail(to, cheque) {
  if (!to) return;

  const subject = `Cheque Received — ₹${cheque.amount_figures} | Cheque No. ${cheque.cheque_number}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #222;">
      <div style="background: #1a1a1a; padding: 20px 24px; border-radius: 8px 8px 0 0;">
        <h2 style="color: #fff; margin: 0; font-size: 18px;">${process.env.FIRM_NAME}</h2>
        <p style="color: #aaa; margin: 4px 0 0; font-size: 13px;">Cheque Receipt Acknowledgment</p>
      </div>
      <div style="border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 8px 8px; padding: 24px;">
        <p style="margin: 0 0 16px;">Dear <strong>${cheque.firm_name}</strong>,</p>
        <p style="margin: 0 0 20px;">We confirm receipt of the following cheque held as security:</p>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr style="background: #f9f9f9;">
            <td style="padding: 10px 12px; border: 1px solid #e5e5e5; color: #666;">Cheque Number</td>
            <td style="padding: 10px 12px; border: 1px solid #e5e5e5; font-weight: 600;">${cheque.cheque_number}</td>
          </tr>
          <tr>
            <td style="padding: 10px 12px; border: 1px solid #e5e5e5; color: #666;">Amount</td>
            <td style="padding: 10px 12px; border: 1px solid #e5e5e5; font-weight: 600;">₹${cheque.amount_figures}</td>
          </tr>
          <tr style="background: #f9f9f9;">
            <td style="padding: 10px 12px; border: 1px solid #e5e5e5; color: #666;">Cheque Date</td>
            <td style="padding: 10px 12px; border: 1px solid #e5e5e5;">${cheque.cheque_date}</td>
          </tr>
          <tr>
            <td style="padding: 10px 12px; border: 1px solid #e5e5e5; color: #666;">Bank</td>
            <td style="padding: 10px 12px; border: 1px solid #e5e5e5;">${cheque.bank_name}${cheque.branch ? ', ' + cheque.branch : ''}</td>
          </tr>
          <tr style="background: #f9f9f9;">
            <td style="padding: 10px 12px; border: 1px solid #e5e5e5; color: #666;">Received by</td>
            <td style="padding: 10px 12px; border: 1px solid #e5e5e5;">${process.env.FIRM_NAME}</td>
          </tr>
          <tr>
            <td style="padding: 10px 12px; border: 1px solid #e5e5e5; color: #666;">Acknowledged at</td>
            <td style="padding: 10px 12px; border: 1px solid #e5e5e5;">${new Date(cheque.acknowledged_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td>
          </tr>
        </table>
        <p style="margin: 20px 0 0; font-size: 13px; color: #888;">This cheque is held as security and will not be presented for payment without prior notice. Please retain this acknowledgment for your records.</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    html
  });
}

module.exports = { sendAcknowledgmentEmail };
