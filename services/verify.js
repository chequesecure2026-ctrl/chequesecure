const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function verifyCheque(cheque) {
  const imagePath = path.join(__dirname, '..', cheque.image_path);
  const imageData = fs.readFileSync(imagePath);
  const base64Image = imageData.toString('base64');
  const mimeType = cheque.image_path.endsWith('.png') ? 'image/png' : 'image/jpeg';

  const prompt = `You are a cheque verification assistant for an Indian business. Analyse this cheque image carefully.

Extract the following fields from the cheque image:
1. Payee name (the name written after "Pay" or "Pay to the order of")
2. Amount in figures (the number in the ₹ box)
3. Amount in words (written out amount)
4. Cheque number (6-digit number printed at bottom)
5. Bank name
6. Branch name/location
7. Date on the cheque
8. Whether it is crossed (two parallel lines)
9. Whether it says "A/c Payee" or "Account Payee" in the crossing
10. Any endorsement on the back mentioning a specific account number

Then verify against these expected values:
- Expected payee: "${process.env.FIRM_PAYEE_NAME}"
- Expected amount: "₹${cheque.amount_figures}"
- Expected cheque number: "${cheque.cheque_number}"
- Expected account number in endorsement: "${process.env.FIRM_ACCOUNT_NUMBER || 'not specified'}"

For each check, mark as: PASS, FAIL, or WARN (if unclear or partially matching).

Also check:
- Do amount in figures and amount in words match each other?
- Is the cheque date valid (not stale — older than 3 months, and not undated)?
- Is the cheque properly signed (signature visible)?

Respond ONLY with a JSON object, no markdown, no preamble. Format:
{
  "overall": "PASS" | "WARN" | "FAIL",
  "overall_reason": "one sentence summary",
  "extracted": {
    "payee": "...",
    "amount_figures": "...",
    "amount_words": "...",
    "cheque_number": "...",
    "bank": "...",
    "branch": "...",
    "date": "...",
    "crossed": true | false,
    "ac_payee": true | false,
    "back_endorsement": "..."
  },
  "checks": [
    { "label": "Payee name match", "status": "PASS"|"FAIL"|"WARN", "note": "..." },
    { "label": "Amount match", "status": "PASS"|"FAIL"|"WARN", "note": "..." },
    { "label": "Cheque number match", "status": "PASS"|"FAIL"|"WARN", "note": "..." },
    { "label": "Amount in words vs figures", "status": "PASS"|"FAIL"|"WARN", "note": "..." },
    { "label": "Cheque date validity", "status": "PASS"|"FAIL"|"WARN", "note": "..." },
    { "label": "A/c Payee crossing", "status": "PASS"|"FAIL"|"WARN", "note": "..." },
    { "label": "Signature present", "status": "PASS"|"FAIL"|"WARN", "note": "..." },
    { "label": "Account endorsement on back", "status": "PASS"|"FAIL"|"WARN", "note": "..." }
  ]
}`;

  const response = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64Image } },
        { type: 'text', text: prompt }
      ]
    }]
  });

  const raw = response.content.map(b => b.text || '').join('');
  const clean = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

module.exports = { verifyCheque };
