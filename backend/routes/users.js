import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getDb } from './db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'REPLACE_WITH_A_STRONG_SECRET';

// Register new user
router.post('/register', async (req, res) => {
  const { username, password, firstName, lastName } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  
  const db = await getDb();
  try {
    const hashed = await bcrypt.hash(password, 10);
    await db.run(`INSERT INTO utilizadores (First_Name, Last_Name, email, password, role, active) 
                  VALUES (?, ?, ?, ?, ?, ?)`, 
                 [firstName || 'User', lastName || '', username, hashed, 2, 1]);
    res.status(201).json({ message: 'User registered' });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(400).json({ error: 'Username already exists' });
  } finally {
    await db.close();
  }
});

// Login user
router.post('/login', async (req, res) => {
  const { username, email, password } = req.body;
  const loginEmail = email || username; // Accept both email and username
  
  if (!loginEmail || !password) return res.status(400).json({ error: 'Email and password required' });
  
  const db = await getDb();
  try {
    // Use your actual database schema - utilizadores table with email field
    const user = await db.get('SELECT * FROM utilizadores WHERE email = ? AND active = 1', [loginEmail]);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check password - handle both hashed and plain text passwords for migration
    let match = false;
    if (user.password) {
      try {
        // Try bcrypt comparison first
        match = await bcrypt.compare(password, user.password.toString());
      } catch (err) {
        // If bcrypt fails, check if it's a plain text password (for existing data)
        match = (password === user.password.toString());
      }
    }
    
    if (!match) {
      console.log('Password mismatch for user:', username);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Create token with user info
    const token = jwt.sign({ 
      id: user.user_id, 
      username: user.email,
      firstName: user.First_Name,
      lastName: user.Last_Name 
    }, JWT_SECRET, { expiresIn: '1h' });
    
    console.log('Login successful for user:', user.user_id);
    res.json({ 
      token,
      user: {
        id: user.user_id,
        email: user.email,
        firstName: user.First_Name,
        lastName: user.Last_Name
      }
    });
    
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    await db.close();
  }
});

// Endpoint to get user creation date and available hours
router.get('/user-available-hours', async (req, res) => {
  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ error: 'user_id required' });
  const db = await getDb();
  try {
    const user = await db.get('SELECT created_at FROM utilizadores WHERE user_id = ?', [user_id]);
    if (!user || !user.created_at) return res.status(404).json({ error: 'User not found' });
    const createdAt = new Date(user.created_at);
    const now = new Date();
    // Calculate months between creation and now
    let months = (now.getFullYear() - createdAt.getFullYear()) * 12 + (now.getMonth() - createdAt.getMonth());
    if (now.getDate() >= createdAt.getDate()) months += 1; // count current month if past creation day
    if (months < 1) months = 1;
    const availableHours = months * 22 * 8;
    res.json({ created_at: user.created_at, availableHours });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  } finally {
    await db.close();
  }
});

// Change password route
router.post('/change-password', async (req, res) => {
  const { user_id, newPassword } = req.body;
  if (!user_id || !newPassword) {
    return res.status(400).json({ error: 'User ID and new password are required' });
  }

  const db = await getDb();
  try {    // Hash the new password using the same method as registration
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password in the database
    await db.run('UPDATE utilizadores SET password = ? WHERE user_id = ?', [hashedPassword, user_id]);
    
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  } finally {
    await db.close();
  }
});

// GET user by github_account (case-insensitive, with or without trailing slash)
router.get('/by-github/:githubAccount', async (req, res) => {
  const db = getDb();
  let githubAccount = req.params.githubAccount;
  if (!githubAccount) return res.status(400).json({ error: 'githubAccount required' });
  githubAccount = githubAccount.replace(/\/$/, ''); // remove trailing slash
  try {
    const user = await db.get(
      'SELECT * FROM utilizadores WHERE LOWER(REPLACE(github_account, "/", "")) = LOWER(REPLACE(?, "/", ""))',
      githubAccount.replace(/\//g, '')
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;