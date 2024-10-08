import express from 'express';
const router = express.Router();
import pool from '../db';

// Create a new ticket
router.post('/', async (req, res) => {
  const { fechaCompra, idEvento, idComprador, importe } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO tickets (fechaCompra, idEvento, idComprador, importe) VALUES ($1, $2, $3, $4) RETURNING *',
      [fechaCompra, idEvento, idComprador, importe]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error inserting ticket' });
  }
});

// Get all tickets
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tickets');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching tickets' });
  }
});

// Get a ticket by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM tickets WHERE ticket = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching ticket' });
  }
});

// Update a ticket by ID
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { fechaCompra, idEvento, idComprador, importe } = req.body;
  try {
    const result = await pool.query(
      'UPDATE tickets SET fechaCompra = $1, idEvento = $2, idComprador = $3, importe = $4 WHERE ticket = $5 RETURNING *',
      [fechaCompra, idEvento, idComprador, importe, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error updating ticket' });
  }
});

// Delete a ticket by ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM tickets WHERE ticket = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error deleting ticket' });
  }
});


export default router;

