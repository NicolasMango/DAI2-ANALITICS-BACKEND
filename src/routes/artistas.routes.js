import express from 'express';
import pool from '../db';

const router = express.Router();

// Create a new artista
router.post('/', async (req, res) => {
  const { generoMusical, edad, nombre, entradasVendidas } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO Artista (generoMusical, edad, nombre, entradasVendidas) VALUES ($1, $2, $3, $4) RETURNING *',
      [generoMusical, edad, nombre, entradasVendidas]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error inserting artista' });
  }
});

// Get all artistas
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM Artista');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching artistas' });
  }
});

// Get an artista by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM Artista WHERE idArtista = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Artista not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching artista' });
  }
});

// Update an artista by ID
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { generoMusical, edad, nombre, entradasVendidas } = req.body;
  try {
    const result = await pool.query(
      'UPDATE Artista SET generoMusical = $1, edad = $2, nombre = $3, entradasVendidas = $4 WHERE idArtista = $5 RETURNING *',
      [generoMusical, edad, nombre, entradasVendidas, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Artista not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error updating artista' });
  }
});

// Delete an artista by ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM Artista WHERE idArtista = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Artista not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error deleting artista' });
  }
});

export default router;