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
2. Amount in figures (the number in the Rs box)
3. Amount in words (written out amount)
4. Cheque number (6-digit number printed at bottom)
5. Bank name
6. Date on the cheque
7. Whether it is crossed (two parallel lines)
8. Whether it says Ac Payee in the crossing
Then verify against these expected values:
- Expected payee: "${process.env.FIRM_PAYEE_NAME}"
- Expected amount: "${cheque.amount_figures}"
- Expected cheque number: "${cheque.cheque_number}"
For each check, mark as PASS, FAIL, or WARN.
Respond ONLY with a JSON object, no markdown, no preamble:
{
  "overall": "PASS or WARN or FAIL",
  "overall_reason": "one sentence summary",
  "extracted": {
    "payee": "...",
    "amount_figures": "...",
    "amount_words": "...",
    "cheque_number": "...",
    "bank": "...",
    "date": "...",
    "crossed": true,
    "ac_payee": true,
    "back_endorsement": "none"
  },
  "checks": [
    { "label": "Payee name match", "status": "PASS", "note": "..." },
    { "label": "Amount match", "status": "PASS", "note": "..." },
    { "label": "Cheque number match", "status": "PASS", "note": "..." },
    { "label": "Amount in words vs figures", "status": "PASS", "note": "..." },
    { "label": "Cheque date validity", "status": "PASS", "note": "..." },
    { "label": "Ac Payee crossing", "status": "WARN", "note": "..." },
    { "label": "Signature present", "status": "PASS", "note": "..." },
    { "label": "Account endorsement on back", "status": "WARN", "note": "..." }
  ]
}`;

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
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