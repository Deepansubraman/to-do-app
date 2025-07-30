require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

// Register
app.post('/api/register', (req, res) => {
  const { user_name, user_pass, user_email } = req.body;
  const hash = bcrypt.hashSync(user_pass, 10);
  db.query(
    'INSERT INTO users (user_name, user_pass, user_email) VALUES (?, ?, ?)',
    [user_name, hash, user_email],
    (err) => {
      if (err) return res.status(400).json({ error: 'Could not register user' });
      res.json({ success: true });
    }
  );
});

// Login
app.post('/api/login', (req, res) => {
  const { user_name, user_pass } = req.body;
  db.query(
    'SELECT * FROM users WHERE user_name = ?',
    [user_name],
    (err, results) => {
      if (err || results.length === 0) {
        return res.status(400).json({ error: 'Invalid username or password' });
      }
      const user = results[0];
      if (!bcrypt.compareSync(user_pass, user.user_pass)) {
        return res.status(400).json({ error: 'Invalid username or password' });
      }
      const token = jwt.sign({ user_id: user.user_id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.json({ token });
    }
  );
});

// Auth middleware
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Get todos
app.get('/api/todos', auth, (req, res) => {
  db.query(
    'SELECT * FROM todos WHERE user_id = ?',
    [req.user.user_id],
    (err, results) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json(results);
    }
  );
});

// Add todo
app.post('/api/todos', auth, (req, res) => {
  const { text, description } = req.body;
  db.query(
    'INSERT INTO todos (user_id, text, description, completed, reward) VALUES (?, ?, ?, false, 0)',
    [req.user.user_id, text, description],
    (err, results) => {
      if (err) return res.status(500).json({ error: 'Failed to add todo' });
      res.json({ success: true, todo_id: results.insertId });
    }
  );
});

// Toggle complete & update reward
app.put('/api/todos/:id', auth, (req, res) => {
  db.query(
    'SELECT completed, reward FROM todos WHERE todo_id = ? AND user_id = ?',
    [req.params.id, req.user.user_id],
    (err, results) => {
      if (err || results.length === 0) return res.status(404).json({ error: 'Todo not found' });

      const todo = results[0];
      const newCompleted = !todo.completed;
      const newReward = newCompleted ? todo.reward + 1 : todo.reward;

      db.query(
        'UPDATE todos SET completed = ?, reward = ? WHERE todo_id = ? AND user_id = ?',
        [newCompleted, newReward, req.params.id, req.user.user_id],
        (err2) => {
          if (err2) return res.status(500).json({ error: 'Failed to update todo' });
          res.json({ success: true });
        }
      );
    }
  );
});

// Delete todo
app.delete('/api/todos/:id', auth, (req, res) => {
  db.query(
    'DELETE FROM todos WHERE todo_id = ? AND user_id = ?',
    [req.params.id, req.user.user_id],
    (err) => {
      if (err) return res.status(500).json({ error: 'Failed to delete todo' });
      res.json({ success: true });
    }
  );
});

// Health check
app.get('/', (req, res) => {
  res.send('Todo List API is running');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
