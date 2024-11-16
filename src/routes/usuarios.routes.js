import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Crear un nuevo usuario
router.post('/', async (req, res) => {
  const { idUsuario, nombreUsuario, fechaNacimiento, nombre, apellido, rol, email, dni } = req.body;

  if (!idUsuario || !nombreUsuario || !fechaNacimiento || !nombre || !apellido || !rol || !email || !dni) {
    return res.status(400).json({ error: 'idUsuario, nombreUsuario, fechaNacimiento, nombre, apellido, rol, email y dni son obligatorios' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO usuarios (idUsuario, nombreUsuario, fechaNacimiento, nombre, apellido, rol, email, dni)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [idUsuario, nombreUsuario, fechaNacimiento, nombre, apellido, rol, email, dni]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear el usuario:', error);
    res.status(500).json({ error: 'Error al crear el usuario' });
  }
});

// Obtener todos los usuarios
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM usuarios');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error al obtener los usuarios:', error);
    res.status(500).json({ error: 'Error al obtener los usuarios' });
  }
});

// Obtener un usuario por ID
router.get('/:idUsuario', async (req, res) => {
  const { idUsuario } = req.params;

  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE idUsuario = $1', [idUsuario]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener el usuario:', error);
    res.status(500).json({ error: 'Error al obtener el usuario' });
  }
});

// Actualizar un usuario por ID
router.put('/:idUsuario', async (req, res) => {
  const { idUsuario } = req.params;
  const { nombreUsuario, fechaNacimiento, nombre, apellido, rol, email, dni } = req.body;

  if (!nombreUsuario || !fechaNacimiento || !nombre || !apellido || !rol || !email || !dni) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  try {
    const result = await pool.query(
      `UPDATE usuarios SET
         nombreUsuario = $1,
         fechaNacimiento = $2,
         nombre = $3,
         apellido = $4,
         rol = $5,
         email = $6,
         dni = $7
       WHERE idUsuario = $8 RETURNING *`,
      [nombreUsuario, fechaNacimiento, nombre, apellido, rol, email, dni, idUsuario]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar el usuario:', error);
    res.status(500).json({ error: 'Error al actualizar el usuario' });
  }
});

// Eliminar un usuario por ID
router.delete('/:idUsuario', async (req, res) => {
  const { idUsuario } = req.params;

  try {
    const result = await pool.query('DELETE FROM usuarios WHERE idUsuario = $1 RETURNING *', [idUsuario]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.status(200).json({ message: 'Usuario eliminado correctamente', usuario: result.rows[0] });
  } catch (error) {
    console.error('Error al eliminar el usuario:', error);
    res.status(500).json({ error: 'Error al eliminar el usuario' });
  }
});

export default router;