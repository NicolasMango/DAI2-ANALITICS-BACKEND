import express from "express";
const router = express.Router();
import fetch from 'node-fetch'; 
import pool from "../db.js";


// Crear un nuevo usuario o manejar eventos relacionados
router.post("/", async (req, res) => {
  console.log("Headers:", req.headers);
  console.log("Cuerpo recibido:", req.body);
  const message = req.body
  const messageType = req.headers["x-amz-sns-message-type"];
  //const message = JSON.parse(req.body);

  console.log("Tipo de mensaje:", messageType);

  // Manejo de SubscriptionConfirmation
  if (messageType === "SubscriptionConfirmation") {
    const confirmUrl = message.SubscribeURL;
    try {
      console.log(`Confirmando suscripción para el tópico: ${message.TopicArn}`);
      await fetch(confirmUrl);
      console.log("Suscripción confirmada exitosamente.");
      res.status(200).send("Suscripción confirmada exitosamente.");
    } catch (error) {
      console.error(`Error al confirmar la suscripción: ${error.message}`);
      await logError("SubscriptionConfirmation", error.message, req.body);
      return res.status(500).send("Error al confirmar la suscripción");
    }
  }

  // Manejo de Notification
  if (messageType === "Notification") {
    console.log("Notificación recibida:", message);

    const {
      googleId,
      username,
      email,
      nombre,
      apellido,
      rol,
    } = message;

    // Validación de datos
    const errores = [];
    if (!googleId) errores.push("El campo 'googleId' es obligatorio.");
    if (!username) errores.push("El campo 'username' es obligatorio.");
    if (!email) errores.push("El campo 'email' es obligatorio.");
    if (!nombre) errores.push("El campo 'nombre' es obligatorio.");
    if (!apellido) errores.push("El campo 'apellido' es obligatorio.");

    if (errores.length > 0) {
      const errorMessage = errores.join(" ");
      console.error("Errores de validación:", errorMessage);
      await logError("Notification", errorMessage, req.body);
      return res.status(400).json({ error: errorMessage });
    }

    try {
      // Insertar o actualizar el usuario
      const result = await pool.query(
        `INSERT INTO usuarios (
           google_id, username, email, nombre, apellido, rol
         ) VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (google_id) DO UPDATE SET
           username = EXCLUDED.username,
           email = EXCLUDED.email,
           nombre = EXCLUDED.nombre,
           apellido = EXCLUDED.apellido,
           rol = EXCLUDED.rol,
           updated_at = NOW()
         RETURNING *`,
        [googleId, username, email, nombre, apellido, rol || "Usuario"]
      );

      console.log("Usuario procesado:", result.rows[0]);

      // Registrar éxito en log_eventos
      await logSuccess("Notification", "Usuario creado/actualizado con éxito", result.rows[0]);

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error("Error al procesar el usuario:", error);
      await logError("Notification", error.message, req.body);
      res.status(500).json({ error: "Error al procesar el usuario" });
    }
  }
});

// Obtener todos los usuarios
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM usuarios ORDER BY created_at DESC");
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error al obtener los usuarios:", error);
    await logError("GET /usuarios", error.message, null);
    res.status(500).json({ error: "Error al obtener los usuarios" });
  }
});

// Obtener un usuario por Google ID
router.get("/:googleId", async (req, res) => {
  const { googleId } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM usuarios WHERE google_id = $1",
      [googleId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener el usuario:", error);
    await logError("GET /usuarios/:googleId", error.message, { googleId });
    res.status(500).json({ error: "Error al obtener el usuario" });
  }
});

// Funciones auxiliares para el registro de logs
async function logError(operation, message, data) {
  try {
    await pool.query(
      `INSERT INTO log_eventos (status, operation, message, data) VALUES ($1, $2, $3, $4)`,
      ["error", operation, message, JSON.stringify(data)]
    );
  } catch (logError) {
    console.error("Error al registrar el log:", logError);
  }
}

async function logSuccess(operation, message, data) {
  try {
    await pool.query(
      `INSERT INTO log_eventos (status, operation, message, data) VALUES ($1, $2, $3, $4)`,
      ["success", operation, message, JSON.stringify(data)]
    );
  } catch (logError) {
    console.error("Error al registrar el log de éxito:", logError);
  }
}

export default router;
