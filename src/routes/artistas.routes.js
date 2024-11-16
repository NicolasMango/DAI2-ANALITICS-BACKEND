import express from 'express';
import pool from '../db.js';

const router = express.Router();
// Crear un nuevo artista
router.post('/', async (req, res) => {
  const { idArtista, nombreArtista, legalOwner, bio, generos } = req.body;

  if (!idArtista || !nombreArtista || !legalOwner) {
    return res.status(400).json({ error: 'idArtista, nombreArtista y legalOwner son obligatorios' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO artistas (idArtista, nombreArtista, legalOwner, bio, generos)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [idArtista, nombreArtista, legalOwner, bio, generos || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear el artista:', error);
    res.status(500).json({ error: 'Error al crear el artista' });
  }
});

// Obtener todos los artistas
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM artistas');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error al obtener los artistas:', error);
    res.status(500).json({ error: 'Error al obtener los artistas' });
  }
});

// Obtener un artista por ID
router.get('/:idArtista', async (req, res) => {
  const { idArtista } = req.params;

  try {
    const result = await pool.query('SELECT * FROM artistas WHERE idArtista = $1', [idArtista]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Artista no encontrado' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener el artista:', error);
    res.status(500).json({ error: 'Error al obtener el artista' });
  }
});

// Actualizar un artista por ID
router.put('/:idArtista', async (req, res) => {
  const { idArtista } = req.params;
  const { nombreArtista, legalOwner, bio, generos } = req.body;

  if (!nombreArtista || !legalOwner) {
    return res.status(400).json({ error: 'nombreArtista y legalOwner son obligatorios' });
  }

  try {
    const result = await pool.query(
      `UPDATE artistas SET 
         nombreArtista = $1, 
         legalOwner = $2, 
         bio = $3, 
         generos = $4
       WHERE idArtista = $5 RETURNING *`,
      [nombreArtista, legalOwner, bio, generos || null, idArtista]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Artista no encontrado' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar el artista:', error);
    res.status(500).json({ error: 'Error al actualizar el artista' });
  }
});

// Eliminar un artista por ID
router.delete('/:idArtista', async (req, res) => {
  const { idArtista } = req.params;

  try {
    const result = await pool.query('DELETE FROM artistas WHERE idArtista = $1 RETURNING *', [idArtista]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Artista no encontrado' });
    }
    res.status(200).json({ message: 'Artista eliminado correctamente', artista: result.rows[0] });
  } catch (error) {
    console.error('Error al eliminar el artista:', error);
    res.status(500).json({ error: 'Error al eliminar el artista' });
  }
});

export default router;