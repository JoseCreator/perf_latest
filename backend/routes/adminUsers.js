import express from 'express';
import { getDb } from './db.js';

const router = express.Router();

// GET all users
router.get('/', async (req, res) => {
    try {
        const db = await getDb();
        const users = await db.all(`
            SELECT 
                user_id as id,
                First_Name as name,
                Last_Name as last_name,
                email,
                role,
                active
            FROM utilizadores
            WHERE active = 1
            ORDER BY First_Name
        `);
        
        console.log('Fetched users:', users);
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// CREATE new user
router.post('/', async (req, res) => {
    try {
        const { name, last_name, email, role, password } = req.body;
        
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email and password are required' });
        }

        const db = await getDb();
        
        // Check if email already exists
        const existingUser = await db.get(
            'SELECT user_id FROM utilizadores WHERE email = ? AND active = 1',
            [email]
        );

        if (existingUser) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        // For simplicity, using password directly. In production, it should be hashed
        const result = await db.run(`
            INSERT INTO utilizadores (
                First_Name, 
                Last_Name,
                email, 
                password,
                role,
                active
            ) VALUES (?, ?, ?, ?, ?, 1)
        `, [name, last_name || '', email, password, role || 0]);

        const newUser = await db.get(
            'SELECT user_id as id, First_Name as name, Last_Name as last_name, email, role, active FROM utilizadores WHERE user_id = ?',
            [result.lastID]
        );

        console.log('Created new user:', newUser);
        res.status(201).json(newUser);
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// UPDATE user
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, last_name, email, role, password } = req.body;
        
        if (!name || !email) {
            return res.status(400).json({ error: 'Name and email are required' });
        }

        const db = await getDb();
        
        // Check if email already exists for other users
        const existingUser = await db.get(
            'SELECT user_id FROM utilizadores WHERE email = ? AND user_id != ? AND active = 1',
            [email, id]
        );

        if (existingUser) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        let updateQuery = `
            UPDATE utilizadores 
            SET 
                First_Name = ?, 
                Last_Name = ?,
                email = ?, 
                role = ?
        `;
        let params = [name, last_name || '', email, role || 0];

        // Only update password if provided
        if (password) {
            updateQuery += ', password = ?';
            params.push(password); // Note: In production, password should be hashed
        }

        updateQuery += ' WHERE user_id = ? AND active = 1';
        params.push(id);

        await db.run(updateQuery, params);

        const updatedUser = await db.get(
            'SELECT user_id as id, First_Name as name, Last_Name as last_name, email, role, active FROM utilizadores WHERE user_id = ?',
            [id]
        );

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        console.log('Updated user:', updatedUser);
        res.json(updatedUser);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// DELETE user (soft delete)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const db = await getDb();
        
        // Soft delete - just update active status
        await db.run(`
            UPDATE utilizadores 
            SET 
                active = 0
            WHERE user_id = ? AND active = 1
        `, [id]);

        const result = await db.get('SELECT changes() as changes');
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'User not found or already deleted' });
        }

        console.log('Deleted user:', id);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

export default router;
