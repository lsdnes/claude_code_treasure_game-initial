import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { tmpdir } from 'os';
import { join } from 'path';

const JWT_SECRET = process.env.JWT_SECRET ?? 'treasure-hunt-secret-key';
const PORT = 3001;

// ── Database ──────────────────────────────────────────────────────────────────
const db = new Database(join(tmpdir(), 'game.db'));
db.pragma('journal_mode = WAL');   // concurrent reads while writing
db.pragma('foreign_keys = ON');    // enforce REFERENCES constraints

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    username     TEXT    UNIQUE NOT NULL,
    password_hash TEXT   NOT NULL,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS scores (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score     INTEGER NOT NULL,
    played_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// ── App ───────────────────────────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json());

function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer '))
    return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(auth.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// POST /api/signup
app.post('/api/signup', async (req, res) => {
  const { username, password } = req.body ?? {};

  if (typeof username !== 'string' || username.trim().length < 3)
    return res.status(400).json({ error: 'Username must be at least 3 characters' });
  if (typeof password !== 'string' || password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const name = username.trim();

  if (db.prepare('SELECT id FROM users WHERE username = ?').get(name))
    return res.status(409).json({ error: 'Username already taken' });

  const passwordHash = await bcrypt.hash(password, 10);
  const { lastInsertRowid } = db
    .prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)')
    .run(name, passwordHash);

  const token = jwt.sign(
    { userId: Number(lastInsertRowid), username: name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.status(201).json({ token, username: name });
});

// POST /api/signin
app.post('/api/signin', async (req, res) => {
  const { username, password } = req.body ?? {};
  if (!username || !password)
    return res.status(400).json({ error: 'Username and password are required' });

  const user = db
    .prepare('SELECT id, username, password_hash FROM users WHERE username = ?')
    .get(username.trim());

  if (!user || !(await bcrypt.compare(password, user.password_hash)))
    return res.status(401).json({ error: 'Invalid username or password' });

  const token = jwt.sign(
    { userId: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.json({ token, username: user.username });
});

// POST /api/scores  — signed-in users only
app.post('/api/scores', requireAuth, (req, res) => {
  const { score } = req.body ?? {};
  if (typeof score !== 'number' || !Number.isFinite(score))
    return res.status(400).json({ error: 'score must be a finite number' });
  db.prepare('INSERT INTO scores (user_id, score) VALUES (?, ?)').run(req.user.userId, score);
  res.json({ ok: true });
});

// GET /api/scores  — signed-in users only
app.get('/api/scores', requireAuth, (req, res) => {
  const rows = db
    .prepare(
      'SELECT score, played_at FROM scores WHERE user_id = ? ORDER BY played_at DESC LIMIT 20'
    )
    .all(req.user.userId);
  res.json(rows);
});

// Local dev only — Vercel imports the app directly via api/index.js
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`API server → http://localhost:${PORT}`));
}

export default app;
