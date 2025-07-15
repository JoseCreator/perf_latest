import express from 'express';
import { getDb } from './db.js';

const router = express.Router();

// GET all clients
router.get('/', async (req, res) => {
    try {
        const db = await getDb();
        const clients = await db.all(`
            SELECT 
                client_id as id,
                name,
                group_id,
                contact,
                email,
                active
            FROM clients
            WHERE active = 1
            ORDER BY name
        `);
        
        console.log('Fetched clients:', clients);
        res.json(clients);
    } catch (error) {
        console.error('Error fetching clients:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// CREATE new client
router.post('/', async (req, res) => {
    try {
        const { name, group_id, contact, email } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }

        const db = await getDb();
        
        const result = await db.run(`
            INSERT INTO clients (
                name, 
                group_id, 
                contact, 
                email, 
                active, 
                created_at, 
                updated_at
            ) VALUES (?, ?, ?, ?, 1, datetime('now'), datetime('now'))
        `, [name, group_id, contact, email]);

        const newClient = await db.get(
            'SELECT client_id as id, name, group_id, contact, email, active FROM clients WHERE client_id = ?',
            [result.lastID]
        );

        console.log('Created new client:', newClient);
        res.status(201).json(newClient);
    } catch (error) {
        console.error('Error creating client:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// UPDATE client
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, group_id, contact, email } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }

        const db = await getDb();
        
        await db.run(`
            UPDATE clients 
            SET 
                name = ?, 
                group_id = ?, 
                contact = ?, 
                email = ?,
                updated_at = datetime('now')
            WHERE client_id = ? AND active = 1
        `, [name, group_id, contact, email, id]);

        const updatedClient = await db.get(
            'SELECT client_id as id, name, group_id, contact, email, active FROM clients WHERE client_id = ?',
            [id]
        );

        if (!updatedClient) {
            return res.status(404).json({ error: 'Client not found' });
        }

        console.log('Updated client:', updatedClient);
        res.json(updatedClient);
    } catch (error) {
        console.error('Error updating client:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// DELETE client (soft delete)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const db = await getDb();
        
        // Soft delete - just update active status
        await db.run(`
            UPDATE clients 
            SET 
                active = 0,
                updated_at = datetime('now')
            WHERE client_id = ? AND active = 1
        `, [id]);

        const result = await db.get('SELECT changes() as changes');
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Client not found or already deleted' });
        }

        console.log('Deleted client:', id);
        res.json({ message: 'Client deleted successfully' });
    } catch (error) {
        console.error('Error deleting client:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

export default router;
