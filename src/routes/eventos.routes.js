import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Create a new evento
router.post('/', async (req, res) => {
  const { idLugar, fecha, CapacidadMaxima, idArtista, cantidadVendida } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO Evento (idLugar, fecha, CapacidadMaxima, idArtista, cantidadVendida) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [idLugar, fecha, CapacidadMaxima, idArtista, cantidadVendida]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error inserting evento' });
  }
});

// Get all eventos
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM Evento');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching eventos' });
  }
});

// Get an evento by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM Evento WHERE idEvento = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Evento not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching evento' });
  }
});

// Update an evento by ID
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { idLugar, fecha, CapacidadMaxima, idArtista, cantidadVendida } = req.body;
  try {
    const result = await pool.query(
      'UPDATE Evento SET idLugar = $1, fecha = $2, CapacidadMaxima = $3, idArtista = $4, cantidadVendida = $5 WHERE idEvento = $6 RETURNING *',
      [idLugar, fecha, CapacidadMaxima, idArtista, cantidadVendida, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Evento not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error updating evento' });
  }
});

// Delete an evento by ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM Evento WHERE idEvento = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Evento not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error deleting evento' });
  }
});
export default router;