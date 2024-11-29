import express from "express";
const router = express.Router();
import fetch from 'node-fetch'; 
import pool from "../db.js";

// Crear un nuevo evento
router.post("/", async (req, res) => {
  console.log("Recitales - Headers:", req.headers);
  console.log("Recitales - Cuerpo recibido:", req.body);
  const message = req.body
  const messageType = req.headers["x-amz-sns-message-type"];
  //const message = JSON.parse(req.body);

  console.log("Recitales - Tipo de mensaje:", messageType);

  // Manejo de SubscriptionConfirmation
  if (messageType === "SubscriptionConfirmation") {
    const confirmUrl = message.SubscribeURL;
    try {
      console.log(`Recitales - Confirmando suscripción para el tópico: ${message.TopicArn}`);
      await fetch(confirmUrl);
      console.log("Recitales - Suscripción confirmada exitosamente.");
      res.status(200).send("Recitales - Suscripción confirmada exitosamente.");
    } catch (error) {
      console.error(`Recitales - Error al confirmar la suscripción: ${error.message}`);
      return res.status(500).send("Recitales - Error al confirmar la suscripción");
    }
  }

  // Manejo de Notification
  if (messageType === "Notification") {
    console.log("Recitales - Notificación recibida:", message);
    let parsedMessage;
    try {
      parsedMessage = JSON.parse(message.Message); // Convierte el campo Message a un objeto
    } catch (err) {
      console.error("Eventos - Error al parsear el campo 'Message':", err.message);
      await logError(
        "Notification",
        "Error al parsear el campo 'Message'",
        req.body
      );
      return res.status(400).json({ error: "Eventos - Formato inválido en el campo 'Message'" });
    }
    const { MessageId: messageId, source, "detail-type": detailType } = parsedMessage;
    if (source !== "artist-module" || detailType !== "recital.created") {
      console.error("Recitales - El mensaje no cumple con los valores esperados.");
      await logError(
        "Notification",
        `El mensaje no tiene los valores esperados. Source: ${source}, Detail-Type: ${detailType}`,
        req.body
      );
      return res.status(400).json({ error: "Recitales - El mensaje no cumple con los valores esperados" });
    }
    // Extraer datos del cuerpo
    const {
      id,
      descripcion,
      ubicacion,
      fecha,
      estadio,
      cantidadSectorGeneral,
      precioGeneralBEAT,
      cantidadSectorVip,
      precioVipBEAT,
      cantidadSectorIzquierda,
      precioIzquierdaBEAT,
      cantidadSectorDerecha,
      precioDerechaBEAT,
      imagenPrincipal,
      habilitado,
      artists,
      entradasRegaladas,
      titulo,
    } = parsedMessage;

    // Validación de datos
    const errores = [];
    if (!id) errores.push("El campo 'id' es obligatorio.");
    if (!descripcion) errores.push("El campo 'descripcion' es obligatorio.");
    if (!ubicacion) errores.push("El campo 'ubicacion' es obligatorio.");
    if (!fecha || isNaN(Date.parse(fecha))) {
      errores.push("El campo 'fecha' debe tener un formato válido (YYYY-MM-DD).");
    }
    if (!Number.isInteger(cantidadSectorGeneral) || cantidadSectorGeneral < 0) {
      errores.push("El campo 'cantidadSectorGeneral' debe ser un número positivo.");
    }
    if (!Number.isInteger(precioGeneralBEAT) || precioGeneralBEAT < 0) {
      errores.push("El campo 'precioGeneralBEAT' debe ser un número positivo.");
    }

    // Registrar y responder en caso de errores
    if (errores.length > 0) {
      const errorMessage = errores.join(" ");
      console.error("Errores de validación:", errorMessage);
      try {
        await pool.query(
          `INSERT INTO log_eventos (message_id, source, status, message, data) VALUES ($1, $2, $3, $4, $5)`,
          [messageId || null, source || null, "error", errorMessage, JSON.stringify(req.body)]
        );
      } catch (logError) {
        console.error("Error al registrar el log:", logError);
      }
      return res.status(400).json({ error: errorMessage });
    }

    // Intentar insertar el evento
    try {
      const eventoResult = await pool.query(
        `INSERT INTO eventos (
           id_evento, descripcion, ubicacion, fecha, estadio, cantidad_sector_general, 
           precio_general_beat, cantidad_sector_vip, precio_vip_beat, 
           cantidad_sector_izquierda, precio_izquierda_beat, cantidad_sector_derecha, 
           precio_derecha_beat, imagen_principal, habilitado , entradas_regaladas, titulo
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16 , $17)
         RETURNING *`,
        [
          id,
          descripcion,
          ubicacion,
          fecha,
          estadio,
          cantidadSectorGeneral,
          precioGeneralBEAT,
          cantidadSectorVip,
          precioVipBEAT,
          cantidadSectorIzquierda,
          precioIzquierdaBEAT,
          cantidadSectorDerecha,
          precioDerechaBEAT,
          imagenPrincipal,
          habilitado,
          entradasRegaladas,
          titulo,
        ]
      );

      // Insertar relación evento-artista
      if (artists && artists.length > 0) {
        for (const artistId of artists) {
          await pool.query(
            `INSERT INTO evento_artista (id_evento, id_artista) VALUES ($1, $2)`,
            [id, artistId]
          );
        }
      }

      // Registrar éxito en la tabla log_eventos
      try {
        await pool.query(
          `INSERT INTO log_eventos (status, message, data) VALUES ($1, $2, $3)`,
          ["success", "Evento creado con éxito", JSON.stringify(eventoResult.rows[0])]
        );
      } catch (logError) {
        console.error("Error al registrar el log de éxito:", logError);
      }

      res.status(201).json(eventoResult.rows[0]);
    } catch (error) {
      console.error("Error al crear el evento:", error);

      // Registrar error en la tabla log_eventos
      try {
        await pool.query(
          `INSERT INTO log_eventos (status, message, data) VALUES ($1, $2, $3)`,
          ["error", "Error al crear el evento", JSON.stringify(req.body)]
        );
      } catch (logError) {
        console.error("Error al registrar el log:", logError);
      }

      res.status(500).json({ error: "Error al crear el evento" });
    }
  }
});

// Obtener todos los eventos y sus artistas
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        e.*, 
       ARRAY_AGG(a.artistic_name) AS artistas
      FROM eventos e
      LEFT JOIN evento_artista ea ON e.id_evento = ea.id_evento
      LEFT JOIN artistas a ON ea.id_artista = a.id_artista
      GROUP BY e.id;
    `);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error al obtener los eventos:", error);
    res.status(500).json({ error: "Error al obtener los eventos" });
  }
});

// Obtener un evento por ID con sus artistas
router.get('/:id', async (req, res) => {
  const { idEvento } = req.params;

  try {
    const result = await pool.query(`
      SELECT e.*, 
             ARRAY_AGG(a.artistic_name) AS artistas
      FROM eventos e
      LEFT JOIN evento_artista ea ON e.id_evento = ea.id_Evento
      LEFT JOIN artistas a ON ea.id_artista = a.id_artista
      WHERE e.id_evento = $1
      GROUP BY e.id_evento
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

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const {
    descripcion,
    ubicacion,
    fecha,
    estadio,
    cantidadSectorGeneral,
    precioGeneralBEAT,
    cantidadSectorVip,
    precioVipBEAT,
    cantidadSectorIzquierda,
    precioIzquierdaBEAT,
    cantidadSectorDerecha,
    precioDerechaBEAT,
    imagenPrincipal,
    habilitado,
    artists, 
    entradasRegaladas,
    titulo,
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE eventos SET
         descripcion = $1,
         ubicacion = $2,
         fecha = $3,
         estadio = $4,
         cantidad_sector_general = $5,
         precio_general_beat = $6,
         cantidad_sector_vip = $7,
         precio_vip_beat = $8,
         cantidad_sector_izquierda = $9,
         precio_izquierda_beat = $10,
         cantidad_sector_derecha = $11,
         precio_derecha_beat = $12,
         imagen_principal = $13,
         habilitado = $14,
         entradas_regaladas = $15,
         titulo = $16,
         updated_at = NOW()
       WHERE id_evento = $17 RETURNING *`,
      [
        descripcion,
        ubicacion,
        fecha,
        estadio,
        cantidadSectorGeneral,
        precioGeneralBEAT,
        cantidadSectorVip,
        precioVipBEAT,
        cantidadSectorIzquierda,
        precioIzquierdaBEAT,
        cantidadSectorDerecha,
        precioDerechaBEAT,
        imagenPrincipal,
        habilitado,
        entradasRegaladas,
        titulo,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Evento no encontrado" });
    }

    // Actualizar relación evento-artista
    await pool.query(`DELETE FROM eventos_artistas WHERE id_evento = $1`, [id]);

    if (artists && artists.length > 0) {
      for (const idArtist of artists) {
        await pool.query(
          `INSERT INTO eventos_artistas (id_evento, id_artista) VALUES ($1, $2)`,
          [id, idArtist]
        );
      }
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error al actualizar el evento:", error);
    res.status(500).json({ error: "Error al actualizar el evento" });
  }
});

// Eliminar un evento y sus relaciones
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(`DELETE FROM eventos WHERE id = $1 RETURNING *`, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Evento no encontrado" });
    }

    res.status(200).json({ message: "Evento eliminado correctamente", evento: result.rows[0] });
  } catch (error) {
    console.error("Error al eliminar el evento:", error);
    res.status(500).json({ error: "Error al eliminar el evento" });
  }
});

// Funciones auxiliares para el registro de logs
async function logError(operation, message, data) {
  try {
    await pool.query(
      `INSERT INTO log_eventos (status, message, data) VALUES ($1, $2, $3)`,
      ["error", message, JSON.stringify(data)]
    );
  } catch (logError) {
    console.error("Error al registrar el log:", logError);
  }
}

async function logSuccess(operation, message, data) {
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