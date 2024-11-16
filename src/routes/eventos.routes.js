import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Crear un nuevo evento
router.post('/', async (req, res) => {
  const {
    idEvento,
    fechaEvento,
    direccion,
    latitud,
    longitud,
    ciudad,
    region,
    pais,
    nombreEvento,
    capacidad,
    duracion,
    observaciones,
    linkCompra,
    artistas // Lista de IDs de artistas relacionados
  } = req.body;

  if (!idEvento || !fechaEvento || !direccion || !ciudad || !pais || !nombreEvento || !capacidad) {
    return res.status(400).json({ error: 'Campos obligatorios no proporcionados' });
  }

  try {
    // Insertar el evento
    const eventoResult = await pool.query(
      `INSERT INTO eventos (
         idEvento, fechaEvento, direccion, latitud, longitud, ciudad, region, pais, nombreEvento, capacidad, duracion, observaciones, linkCompra
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [idEvento, fechaEvento, direccion, latitud, longitud, ciudad, region, pais, nombreEvento, capacidad, duracion, observaciones, linkCompra]
    );

    // Insertar relación evento-artista
    if (artistas && artistas.length > 0) {
      for (const idArtista of artistas) {
        await pool.query(
          `INSERT INTO evento_artista (idEvento, idArtista) VALUES ($1, $2)`,
          [idEvento, idArtista]
        );
      }
    }

    res.status(201).json(eventoResult.rows[0]);
  } catch (error) {
    console.error('Error al crear el evento:', error);
    res.status(500).json({ error: 'Error al crear el evento' });
  }
});

// Obtener todos los eventos y sus artistas
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT e.*, 
             ARRAY_AGG(a.nombreArtista) AS artistas
      FROM eventos e
      LEFT JOIN evento_artista ea ON e.idEvento = ea.idEvento
      LEFT JOIN artistas a ON ea.idArtista = a.idArtista
      GROUP BY e.idEvento
    `);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error al obtener los eventos:', error);
    res.status(500).json({ error: 'Error al obtener los eventos' });
  }
});

// Obtener un evento por ID con sus artistas
router.get('/:idEvento', async (req, res) => {
  const { idEvento } = req.params;

  try {
    const result = await pool.query(`
      SELECT e.*, 
             ARRAY_AGG(a.nombreArtista) AS artistas
      FROM eventos e
      LEFT JOIN evento_artista ea ON e.idEvento = ea.idEvento
      LEFT JOIN artistas a ON ea.idArtista = a.idArtista
      WHERE e.idEvento = $1
      GROUP BY e.idEvento
    `, [idEvento]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener el evento:', error);
    res.status(500).json({ error: 'Error al obtener el evento' });
  }
});

// Actualizar un evento y sus artistas
router.put('/:idEvento', async (req, res) => {
  const { idEvento } = req.params;
  const {
    fechaEvento,
    direccion,
    latitud,
    longitud,
    ciudad,
    region,
    pais,
    nombreEvento,
    capacidad,
    duracion,
    observaciones,
    linkCompra,
    artistas // Lista de IDs de artistas relacionados
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE eventos SET
         fechaEvento = $1,
         direccion = $2,
         latitud = $3,
         longitud = $4,
         ciudad = $5,
         region = $6,
         pais = $7,
         nombreEvento = $8,
         capacidad = $9,
         duracion = $10,
         observaciones = $11,
         linkCompra = $12
       WHERE idEvento = $13 RETURNING *`,
      [fechaEvento, direccion, latitud, longitud, ciudad, region, pais, nombreEvento, capacidad, duracion, observaciones, linkCompra, idEvento]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    // Actualizar relación evento-artista
    await pool.query(`DELETE FROM evento_artista WHERE idEvento = $1`, [idEvento]);

    if (artistas && artistas.length > 0) {
      for (const idArtista of artistas) {
        await pool.query(
          `INSERT INTO evento_artista (idEvento, idArtista) VALUES ($1, $2)`,
          [idEvento, idArtista]
        );
      }
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar el evento:', error);
    res.status(500).json({ error: 'Error al actualizar el evento' });
  }
});

// Eliminar un evento y sus relaciones
router.delete('/:idEvento', async (req, res) => {
  const { idEvento } = req.params;

  try {
    const result = await pool.query(`DELETE FROM eventos WHERE idEvento = $1 RETURNING *`, [idEvento]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    res.status(200).json({ message: 'Evento eliminado correctamente', evento: result.rows[0] });
  } catch (error) {
    console.error('Error al eliminar el evento:', error);
    res.status(500).json({ error: 'Error al eliminar el evento' });
  }
});

export default router;