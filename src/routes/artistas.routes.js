import express from "express";
const router = express.Router();
import fetch from 'node-fetch'; 
import pool from "../db.js";


// Crear o manejar eventos relacionados con artistas
router.post("/", async (req, res) => {
  console.log("Artistas - Headers:", req.headers);
  console.log("Artistas - Cuerpo recibido:", req.body);

  const messageType = req.headers["x-amz-sns-message-type"];
  const message = req.body;

  if (!messageType) {
    return res.status(400).json({ error: "Falta el header 'x-amz-sns-message-type'" });
  }

  // Manejo de SubscriptionConfirmation
  if (messageType === "SubscriptionConfirmation") {
    const confirmUrl = message.SubscribeURL;
    try {
      console.log(`Artistas - Confirmando suscripción para el tópico: ${message.TopicArn}`);
      await fetch(confirmUrl);
      console.log("Artistas - Suscripción confirmada exitosamente.");
      res.status(200).send("Artistas - Suscripción confirmada exitosamente.");
    } catch (error) {
      console.error(`Artistas - Error al confirmar la suscripción: ${error.message}`);
      return res.status(500).send("Error al confirmar la suscripción");
    }
  }

  // Manejo de Notification
  if (messageType === "Notification") {
    console.log("Artistas - Notificación recibida:", message);

      // Parsear el campo Message como JSON
    let parsedMessage;
    try {
      parsedMessage = JSON.parse(message.Message); // Convierte el campo Message a un objeto
    } catch (err) {
      console.error("Artistas - Error al parsear el campo 'Message':", err.message);
      await logError(
        "Notification",
        "Error al parsear el campo 'Message'",
        req.body
      );
      return res.status(400).json({ error: "Artistas - Formato inválido en el campo 'Message'" });
    }
    const { MessageId: messageId, source , "detail-type": detailType } = parsedMessage; // Obtener messageId y source

    if (source !== "artist-module" || detailType !== "artist.profile.created") {
      console.error("Artistas - El mensaje no cumple con los valores esperados.");
      await logError(
        "Notification",
        `El mensaje no tiene los valores esperados. Source: ${source}, Detail-Type: ${detailType}`,
        req.body
      );
      return res.status(400).json({ error: "Artistas - El mensaje no cumple con los valores esperados" });
    }

    // Validación del cuerpo del mensaje
    const {
      artistId,
      artisticName,
      legalOwner,
      bio,
      socialMediaIds,
      genreIds,
      imageUrls,
    } = parsedMessage;

    const errores = [];
    if (!artistId) errores.push("El campo 'artistId' es obligatorio.");
    if (!artisticName) errores.push("El campo 'artisticName' es obligatorio.");
    if (!legalOwner) errores.push("El campo 'legalOwner' es obligatorio.");
    if (!socialMediaIds || !Array.isArray(socialMediaIds)) {
      errores.push("El campo 'socialMediaIds' debe ser un array.");
    }
    if (!genreIds || !Array.isArray(genreIds)) {
      errores.push("El campo 'genreIds' debe ser un array.");
    }
    if (!imageUrls || !Array.isArray(imageUrls)) {
      errores.push("El campo 'imageUrls' debe ser un array.");
    }

    // Log y respuesta en caso de errores
    if (errores.length > 0) {
      const errorMessage = errores.join(" ");
      console.error("Errores de validación:", errorMessage);
      try {
        await pool.query(
          `INSERT INTO log_eventos (message_id, source, status, message, data) VALUES ($1, $2, $3, $4, $5)`,
          [messageId || null, source || null, "error", errorMessage, JSON.stringify(message)]
        );
      } catch (logError) {
        console.error("Error al registrar el log:", logError);
      }
      return res.status(400).json({ error: errorMessage });
    }

    // Intentar insertar o actualizar el artista
    try {
      const result = await pool.query(
        `INSERT INTO artistas (
          id_artista,
          artistic_name,
          legal_owner,
          bio,
          social_media_ids,
          genre_ids,
          image_urls
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
          artistId,
          artisticName,
          legalOwner,
          bio,
          JSON.stringify(socialMediaIds),
          JSON.stringify(genreIds),
          JSON.stringify(imageUrls),
        ]
      );

      console.log("Artistas creada exitosamente:", result.rows[0]);
      await logSuccess("Notification", "Artistas creada exitosamente.", result.rows[0]);
      // Log de éxito
      try {
        await pool.query(
          `INSERT INTO log_eventos (message_id, source, status, message, data) VALUES ($1, $2, $3, $4, $5)`,
          [messageId || null, source || null, "success", "Artista creado o actualizado con éxito", JSON.stringify(result.rows[0])]
        );
      } catch (logError) {
        console.error("Error al registrar el log de éxito:", logError);
      }

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error("Error al procesar el artista:", error);

      // Log del error
      try {
        await pool.query(
          `INSERT INTO log_eventos (message_id, source, status, message, data) VALUES ($1, $2, $3, $4, $5)`,
          [messageId || null, source || null, "error", "Error al procesar el artista", JSON.stringify(message)]
        );
      } catch (logError) {
        console.error("Error al registrar el log:", logError);
      }

      res.status(500).json({ error: "Error al procesar el artista" });
    }
  }
});

// Obtener todos los artistas
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM artistas");
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error al obtener los artistas:", error);
    res.status(500).json({ error: "Error al obtener los artistas" });
  }
});

// Obtener un artista por ID
router.get("/:idArtist", async (req, res) => {
  const { idArtist } = req.params;

  try {
    const result = await pool.query("SELECT * FROM artistas WHERE id_artista = $1", [idArtist]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Artista no encontrado" });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener el artista:", error);
    res.status(500).json({ error: "Error al obtener el artista" });
  }
});

// Eliminar un artista por ID
router.delete("/:idArtist", async (req, res) => {
  const { idArtist } = req.params;

  try {
    const result = await pool.query("DELETE FROM artistas WHERE id_artista = $1 RETURNING *", [idArtist]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Artista no encontrado" });
    }
    res.status(200).json({ message: "Artista eliminado correctamente", artist: result.rows[0] });
  } catch (error) {
    console.error("Error al eliminar el artista:", error);
    res.status(500).json({ error: "Error al eliminar el artista" });
  }
});


// Funciones auxiliares para el registro de logs
async function logError( message, data) {
  try {
    await pool.query(
      `INSERT INTO log_eventos (status, message, data) VALUES ($1, $2, $3)`,
      ["error", message, JSON.stringify(data)]
    );
  } catch (logError) {
    console.error("Error al registrar el log:", logError);
  }
}

async function logSuccess( message, data) {
  try {
    await pool.query(
      `INSERT INTO log_eventos (status, message, data) VALUES ($1, $2, $3)`,
      ["success", message, JSON.stringify(data)]
    );
  } catch (logError) {
    console.error("Error al registrar el log de éxito:", logError);
  }
}

export default router;
