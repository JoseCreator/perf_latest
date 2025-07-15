import express from 'express';
import { getDb } from './db.js';

const router = express.Router();

// GET all absences
router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const absences = await db.all('SELECT * FROM absences');
    await db.close();
    res.json(absences);
  } catch (error) {
    console.error('Error fetching absences:', error);
    res.status(500).json({ error: 'Failed to fetch absences' });
  }
});

// POST new absence
router.post('/', async (req, res) => {
  const {
    title,
    startDate,
    endDate,
    time,
    description,
    location,
    attendees,
    color
  } = req.body;

  try {
    const db = await getDb();
    const result = await db.run(
      `INSERT INTO absences (
        title, startDate, endDate, time, description, location, attendees, color
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, startDate, endDate, time, description, location, attendees, color]
    );
    await db.close();
    res.status(201).json({ 
      message: 'Absence created successfully',
      id: result.lastID 
    });
  } catch (error) {
    console.error('Error creating absence:', error);
    res.status(500).json({ error: 'Failed to create absence' });
  }
});

// DELETE absence
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const db = await getDb();
    await db.run('DELETE FROM absences WHERE id = ?', [id]);
    await db.close();
    res.json({ message: 'Absence deleted successfully' });
  } catch (error) {
    console.error('Error deleting absence:', error);
    res.status(500).json({ error: 'Failed to delete absence' });
  }
});

// UPDATE absence
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const {
    title,
    startDate,
    endDate,
    time,
    description,
    location,
    attendees,
    color
  } = req.body;

  try {
    const db = await getDb();
    await db.run(
      `UPDATE absences 
       SET title = ?, startDate = ?, endDate = ?, time = ?, 
           description = ?, location = ?, attendees = ?, color = ?
       WHERE id = ?`,
      [title, startDate, endDate, time, description, location, attendees, color, id]
    );
    await db.close();
    res.json({ message: 'Absence updated successfully' });
  } catch (error) {
    console.error('Error updating absence:', error);
    res.status(500).json({ error: 'Failed to update absence' });
  }
});

export default router;
