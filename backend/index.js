const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Create/open SQLite database
const db = new Database('/data/users.db');

// Create users table and seed a test user on startup
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  );
  INSERT OR IGNORE INTO users (username, password) VALUES ('admin', 'password123');
  INSERT OR IGNORE INTO users (username, password) VALUES ('student', 'cloud2024');
`);

// Health check endpoint (used by Kubernetes liveness probe)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: process.env.APP_VERSION || '3.0' });
});

// Login endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password);
  if (user) {
    res.json({ success: true, message: `Welcome, ${user.username}!` });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// List all users (to prove DB works during demo)
app.get('/api/users', (req, res) => {
  const users = db.prepare('SELECT id, username FROM users').all();
  res.json(users);
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
