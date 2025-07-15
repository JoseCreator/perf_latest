import express from 'express';
import { getDb } from './db.js';

const router = express.Router();

// GET all projects
router.get('/', async (req, res) => {
    try {
        const db = await getDb();
        const projects = await db.all(`
            SELECT 
                project_id as id,
                project_name as name,
                project_type,
                project_description,
                client_id,
                start_date,
                end_date,
                hourly_rate,
                total_hours,
                total_cost,
                status,
                group_id,
                created_at,
                updated_at
            FROM projects
            ORDER BY project_name
        `);
        
        console.log('Fetched projects:', projects);
        res.json(projects);
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// CREATE new project
router.post('/', async (req, res) => {
    try {
        const { 
            name, 
            project_type,
            project_description,
            client_id,
            start_date,
            end_date,
            hourly_rate,
            status,
            group_id
        } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: 'Project name is required' });
        }

        const db = await getDb();
        
        const result = await db.run(`
            INSERT INTO projects (
                project_name,
                project_type,
                project_description,
                client_id,
                start_date,
                end_date,
                hourly_rate,
                status,
                group_id,
                created_at,
                updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `, [
            name,
            project_type || null,
            project_description || null,
            client_id || null,
            start_date || null,
            end_date || null,
            hourly_rate || null,
            status || 'Active',
            group_id || null
        ]);

        const newProject = await db.get(`
            SELECT 
                project_id as id,
                project_name as name,
                project_type,
                project_description,
                client_id,
                start_date,
                end_date,
                hourly_rate,
                total_hours,
                total_cost,
                status,
                group_id,
                created_at,
                updated_at
            FROM projects 
            WHERE project_id = ?`,
            [result.lastID]
        );

        console.log('Created new project:', newProject);
        res.status(201).json(newProject);
    } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// UPDATE project
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            name, 
            project_type,
            project_description,
            client_id,
            start_date,
            end_date,
            hourly_rate,
            status,
            group_id
        } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: 'Project name is required' });
        }

        const db = await getDb();
        
        await db.run(`
            UPDATE projects 
            SET 
                project_name = ?,
                project_type = ?,
                project_description = ?,
                client_id = ?,
                start_date = ?,
                end_date = ?,
                hourly_rate = ?,
                status = ?,
                group_id = ?,
                updated_at = datetime('now')
            WHERE project_id = ?
        `, [
            name,
            project_type || null,
            project_description || null,
            client_id || null,
            start_date || null,
            end_date || null,
            hourly_rate || null,
            status || 'Active',
            group_id || null,
            id
        ]);

        const updatedProject = await db.get(`
            SELECT 
                project_id as id,
                project_name as name,
                project_type,
                project_description,
                client_id,
                start_date,
                end_date,
                hourly_rate,
                total_hours,
                total_cost,
                status,
                group_id,
                created_at,
                updated_at
            FROM projects 
            WHERE project_id = ?`,
            [id]
        );

        if (!updatedProject) {
            return res.status(404).json({ error: 'Project not found' });
        }

        console.log('Updated project:', updatedProject);
        res.json(updatedProject);
    } catch (error) {
        console.error('Error updating project:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// DELETE project
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const db = await getDb();
        
        // Update status instead of deleting
        await db.run(`
            UPDATE projects 
            SET 
                status = 'Inactive',
                updated_at = datetime('now')
            WHERE project_id = ?
        `, [id]);

        const result = await db.get('SELECT changes() as changes');
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        console.log('Deleted project:', id);
        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

export default router;
