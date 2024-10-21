import express from 'express';
import pool from '../db.js';
const router = express.Router();


// Create a new lugar
router.post('/', async (req, res) => {
  const { Ciudad, pais, direcciones, cantidadEspectadores, sectores } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO Lugares (Ciudad, pais, direcciones, cantidadEspectadores, sectores) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [Ciudad, pais, direcciones, cantidadEspectadores, sectores]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error inserting lugar' });
  }
});

// Get all lugares
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM Lugares');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching lugares' });
  }
});

// Get a lugar by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM Lugares WHERE idRecinto = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lugar not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching lugar' });
  }
});

// Update a lugar by ID
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { Ciudad, pais, direcciones, cantidadEspectadores, sectores } = req.body;
  try {
    const result = await pool.query(
      'UPDATE Lugares SET Ciudad = $1, pais = $2, direcciones = $3, cantidadEspectadores = $4, sectores = $5 WHERE idRecinto = $6 RETURNING *',
      [Ciudad, pais, direcciones, cantidadEspectadores, sectores, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lugar not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error updating lugar' });
  }
});

// Delete a lugar by ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM Lugares WHERE idRecinto = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lugar not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error deleting lugar' });
  }
});

export default router;