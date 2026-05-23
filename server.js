require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const { initDB } = require('./db');

// Ensure uploads directory exists
if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
  fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });
}

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'changeme',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 8 * 60 * 60 * 1000 }
}));

// Serve uploaded cheque images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve static frontend files
app.use('/public', express.static(path.join(__dirname, 'public')));

// Routes
app.use('/submit', require('./routes/submit'));
app.use('/admin', require('./routes/admin'));
app.use('/acknowledge', require('./routes/acknowledge'));

// Root redirect
app.get('/', (req, res) => res.redirect('/admin'));

const PORT = process.env.PORT || 3000;

initDB().then(() => {
  app.listen(PORT, () => console.log(`Cheque portal running on port ${PORT}`));
}).catch(err => {
  console.error('DB init failed:', err);
  process.exit(1);
});