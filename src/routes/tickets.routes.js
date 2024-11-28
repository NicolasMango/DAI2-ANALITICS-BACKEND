import express from "express";
const router = express.Router();
import fetch from 'node-fetch'; 
import pool from "../db.js";

// Crear un nuevo ticket
router.post("/", async (req, res) => {
  console.log("Tickets Headers:", req.headers);
  console.log("Tickets Cuerpo recibido:", req.body);
  const message = req.body
  const messageType = req.headers["x-amz-sns-message-type"];
  //const message = JSON.parse(req.body);
  console.log("Tickets Tipo de mensaje:", messageType);

  // Confirmar suscripción
  if (messageType === "SubscriptionConfirmation") {
    const confirmUrl = message.SubscribeURL;

    try {
      console.log(`Tickets - Confirmando suscripción para el tópico: ${message.TopicArn}`);
      await fetch(confirmUrl);
      console.log("Tickets - Suscripción confirmada exitosamente.");
    } catch (error) {
      console.error(`Tickets -Error al confirmar la suscripción: ${error.message}`);
      return res.status(500).send("Error al confirmar la suscripción");
    }
  }
// Manejar notificaciones
if (messageType === "Notification") {
  console.log("Tickets - Notificación recibida:", message);
  
  const { MessageId: messageId, source , "detail-type": detailType } = message; // Obtener messageId y source

  if (source !== "tickets-module" || detailType !== "ticket.purchase") {
      console.error("Tickets - El mensaje no cumple con los valores esperados.");
      await logError(
        "Notification",
        `El mensaje no tiene los valores esperados. Source: ${source}, Detail-Type: ${detailType}`,
        req.body
      );
      return res.status(400).json({ error: "Tickets - El mensaje no cumple con los valores esperados" });
  }
  // Extraer datos del cuerpo de la solicitud
  const {
    idPago,
    estado,
    idUsuario,
    idEvento,
    precioTotal,
    estadio,
    cantidadSectorGeneral,
    cantidadSectorVip,
    cantidadSectorIzquierda,
    cantidadSectorDerecha,
  } = req.body;

  // Validar que los campos requeridos estén presentes
  const errores = [];
  if (!idPago) errores.push("El campo 'idPago' es obligatorio.");
  if (!idUsuario) errores.push("El campo 'idUsuario' es obligatorio.");
  if (!idEvento) errores.push("El campo 'idEvento' es obligatorio.");
  if (!precioTotal) {
    errores.push("El campo 'precioTotal' es obligatorio.");
  } else if (isNaN(precioTotal.$numberInt) || precioTotal.$numberInt <= 0) {
    errores.push("El campo 'precioTotal' debe ser un número mayor a 0.");
  }

  // Si hay errores, registrar en la tabla de errores y responder
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

  // Intentar insertar en la tabla principal
  try {
    console.log("Valores recibidos:", {
      idPago,
      estado,
      idUsuario,
      idEvento,
      precioTotal,
      estadio,
      cantidadSectorGeneral,
      cantidadSectorVip,
      cantidadSectorIzquierda,
      cantidadSectorDerecha,
    });

    const result = await pool.query(
      `INSERT INTO tickets (
        id_ticket,
        estado,
        id_usuario,
        id_evento,
        precio_total,
        estadio,
        cantidad_sector_general,
        cantidad_sector_vip,
        cantidad_sector_izquierda,
        cantidad_sector_derecha
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        idPago,
        estado,
        idUsuario,
        idEvento,
        precioTotal.$numberInt,
        estadio.$numberInt,
        cantidadSectorGeneral.$numberInt,
        cantidadSectorVip.$numberInt,
        cantidadSectorIzquierda.$numberInt,
        cantidadSectorDerecha.$numberInt,
      ]
    );

    // Registrar el éxito en la tabla de logs
    try {
      await pool.query(
        `INSERT INTO log_eventos (message_id, source, status, message, data) VALUES ($1, $2, $3, $4, $5)`,
        [messageId || null, source || null, "success", "Ticket registrado con éxito", JSON.stringify(result.rows[0])]
      );
    } catch (logError) {
      console.error("Error al registrar el log de éxito:", logError);
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error al registrar el Ticket:", error);

    // Registrar el error en la tabla de logs
    try {
      await pool.query(
        `INSERT INTO log_eventos (message_id, source, status, message, data) VALUES ($1, $2, $3, $4, $5)`,
        [messageId || null, source || null, "error", "Error al registrar el Ticket", JSON.stringify(req.body)]
      );
    } catch (logError) {
      console.error("Error al registrar el log:", logError);
    }

    res.status(500).json({ error: "Error al registrar el Ticket" });
  }
}
});
// Obtener todos los tickets
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM tickets");
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error al obtener los tickets :", error);
    res.status(500).json({ error: "Error al obtener los tickets" });
  }
});

// Obtener un pago por idPago
router.get("/:idPago", async (req, res) => {
  const { idPago } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM tickets WHERE id_ticket = $1",
      [idPago]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Ticket no encontrado" });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener el ticket:", error);
    res.status(500).json({ error: "Error al obtener el ticket" });
  }
});

// Actualizar un pago por idPago
router.put("/:idPago", async (req, res) => {
  const { idPago } = req.params;
  const {
    estado,
    idUsuario,
    idEvento,
    precioTotal,
    estadio,
    cantidadSectorGeneral,
    cantidadSectorVip,
    cantidadSectorIzquierda,
    cantidadSectorDerecha,
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE tickets SET 
         estado = $1, 
         id_usuario = $2, 
         id_evento = $3, 
         precio_total = $4, 
         estadio = $5, 
         cantidad_sector_general = $6, 
         cantidad_sector_vip = $7,
         cantidad_sector_izquierda = $8,
         cantidad_sector_derecha = $9
       WHERE id_ticket = $10 RETURNING *`,
      [
        estado,
        idUsuario,
        idEvento,
        precioTotal.$numberInt,
        estadio.$numberInt,
        cantidadSectorGeneral.$numberInt,
        cantidadSectorVip.$numberInt,
        cantidadSectorIzquierda.$numberInt,
        cantidadSectorDerecha.$numberInt,
        idPago,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Ticket no encontrado" });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error al actualizar el ticket:", error);
    res.status(500).json({ error: "Error al actualizar el ticket" });
  }
});

// Eliminar un pago por idPago
router.delete("/:idPago", async (req, res) => {
  const { idPago } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM tickets WHERE id_ticket = $1 RETURNING *",
      [idPago]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Ticket no encontrado" });
    }
    res.status(200).json({
      message: "Ticket eliminado correctamente",
      pago: result.rows[0],
    });
  } catch (error) {
    console.error("Error al eliminar el ticket:", error);
    res.status(500).json({ error: "Error al eliminar el ticket" });
  }
});


// Funciones auxiliares para el registro de logs
async function logError(operation, message, data) {
  try {
    await pool.query(
      `INSERT INTO log_eventos (status, message, data) VALUES ($1, $2, $3, $4)`,
      ["error", message, JSON.stringify(data)]
    );
  } catch (logError) {
    console.error("Error al registrar el log:", logError);
  }
}

async function logSuccess(operation, message, data) {
  try {
    await pool.query(
      `INSERT INTO log_eventos (status, message, data) VALUES ($1, $2, $3, $4)`,
      ["success", message, JSON.stringify(data)]
    );
  } catch (logError) {
    console.error("Error al registrar el log de éxito:", logError);
  }
}
export default router;
