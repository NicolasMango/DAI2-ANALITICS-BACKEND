import express from 'express';
import pool from '../db';

const router = express.Router();


// Create a new comprador
router.post('/', async (req, res) => {
  const { fechaNacimiento, nombre, apellido, dni } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO Compradores (fechaNacimiento, nombre, apellido, dni) VALUES ($1, $2, $3, $4) RETURNING *',
      [fechaNacimiento, nombre, apellido, dni]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error inserting comprador' });
  }
});

// Get all compradores
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM Compradores');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching compradores' });
  }
});

// Get a comprador by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM Compradores WHERE idUsuario = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Comprador not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching comprador' });
  }
});

// Update a comprador by ID
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { fechaNacimiento, nombre, apellido, dni } = req.body;
  try {
    const result = await pool.query(
      'UPDATE Compradores SET fechaNacimiento = $1, nombre = $2, apellido = $3, dni = $4 WHERE idUsuario = $5 RETURNING *',
      [fechaNacimiento, nombre, apellido, dni, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Comprador not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error updating comprador' });
  }
});

// Delete a comprador by ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM Compradores WHERE idUsuario = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Comprador not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error deleting comprador' });
  }
});
export default router;