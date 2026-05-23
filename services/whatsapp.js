const twilio = require('twilio');

function getClient() {
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

async function sendAcknowledgmentWhatsApp(toNumber, cheque) {
  if (!toNumber) return;

  const to = `whatsapp:${toNumber.startsWith('+') ? toNumber : '+91' + toNumber}`;

  const message = `✅ *Cheque Received — ${process.env.FIRM_NAME}*

Dear *${cheque.firm_name}*,

We confirm receipt of the following cheque held as security:

📄 *Cheque No:* ${cheque.cheque_number}
💰 *Amount:* ₹${cheque.amount_figures}
📅 *Cheque Date:* ${cheque.cheque_date}
🏦 *Bank:* ${cheque.bank_name}${cheque.branch ? ', ' + cheque.branch : ''}
🕐 *Received at:* ${new Date(cheque.acknowledged_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}

This cheque is held as security and will not be presented for payment without prior notice.

Please retain this message as your acknowledgment.`;

  const client = getClient();
  await client.messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM,
    to,
    body: message
  });
}

module.exports = { sendAcknowledgmentWhatsApp };
