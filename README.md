# Cheque Portal

A secure cheque collection and AI-powered verification portal for distributors.

## What it does

- Poultry firms get a unique submission link per firm
- They upload cheque photo + details on their phone
- AI (Claude) verifies the cheque automatically
- Admin sees PASS/WARN/FAIL result on dashboard
- One-click acknowledgment sends WhatsApp + Email receipt to the firm

---

## Local Setup

```bash
npm install
cp .env.example .env
# Fill in your .env values
node server.js
```

---

## Railway Deployment

1. Push this folder to a GitHub repository

2. Go to https://railway.app → New Project → Deploy from GitHub

3. Add a PostgreSQL service inside the same project
   - Railway auto-sets DATABASE_URL as an environment variable

4. Add all environment variables from .env.example in Railway → Variables tab

5. Set the start command to: `node server.js`

6. Deploy. Railway gives you a public URL automatically.

---

## Environment Variables

| Variable | Description |
|---|---|
| PORT | Railway sets this automatically |
| SESSION_SECRET | Any long random string |
| ADMIN_PASSWORD | Your admin login password |
| DATABASE_URL | PostgreSQL URL (Railway sets automatically) |
| ANTHROPIC_API_KEY | From https://console.anthropic.com |
| SMTP_HOST | e.g. smtp.gmail.com |
| SMTP_PORT | 587 |
| SMTP_USER | Your Gmail address |
| SMTP_PASS | Gmail App Password (not your Gmail password) |
| SMTP_FROM | Display name + email |
| TWILIO_ACCOUNT_SID | From https://console.twilio.com |
| TWILIO_AUTH_TOKEN | From Twilio console |
| TWILIO_WHATSAPP_FROM | whatsapp:+14155238886 (Twilio sandbox) |
| FIRM_NAME | Your firm's display name |
| FIRM_PAYEE_NAME | Exact payee name on cheques |
| FIRM_ACCOUNT_NUMBER | Your bank account number |
| FIRM_BANK | Your bank name |

---

## Gmail App Password Setup

1. Go to Google Account → Security → 2-Step Verification (enable it)
2. Then go to Security → App Passwords
3. Generate a password for "Mail"
4. Use that 16-character password as SMTP_PASS

---

## Twilio WhatsApp Setup

1. Sign up at https://twilio.com
2. Go to Messaging → Try it out → Send a WhatsApp message
3. Your firms need to send "join <sandbox-keyword>" to +14155238886 once to opt in
4. For production, apply for a WhatsApp Business number through Twilio

---

## How to Use

### Adding a firm
1. Go to /admin → Firms tab
2. Fill in firm name, contact, email, WhatsApp number
3. Click Add Firm
4. Copy the unique submission link and send it to the firm (WhatsApp/email)

### Daily workflow
1. Collector visits firm, firm opens their link on phone
2. Firm uploads cheque photo + fills details, submits
3. Your admin dashboard shows the submission with AI verification
4. Review PASS/WARN/FAIL result
5. Click Acknowledge → firm gets WhatsApp + Email confirmation instantly

---

## Tech Stack

- Node.js + Express
- PostgreSQL (Railway)
- Multer (file uploads)
- Anthropic Claude API (cheque verification)
- Nodemailer (email)
- Twilio (WhatsApp)
