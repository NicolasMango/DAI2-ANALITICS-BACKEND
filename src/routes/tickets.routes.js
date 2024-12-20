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
  // Parsear el campo Message como JSON
  let parsedMessage;
  try {
    parsedMessage = JSON.parse(message.Message); // Convierte el campo Message a un objeto
  } catch (err) {
    console.error("Tickets - Error al parsear el campo 'Message':", err.message);
    await logError(
      "Notification",
      "Error al parsear el campo 'Message'",
      req.body
    );
    return res.status(400).json({ error: "Tickets - Formato inválido en el campo 'Message'" });
  }
  const { MessageId: messageId, source , "detail-type": detailType } = parsedMessage; // Obtener messageId y source

  if (source !== "tickets-module" || (detailType !== "ticket.purchase" && detailType !== "ticket.repurchase")) {
    console.error("Tickets - El mensaje no cumple con los valores esperados.");
    await logError(
      "Notification",
      `El mensaje no tiene los valores esperados. Source: ${source}, Detail-Type: ${detailType}`,
      req.body
    );
    return res.status(400).json({ error: "Tickets - El mensaje no cumple con los valores esperados" });
  }
  
  if (detailType === "ticket.repurchase"){
    const {
      mailUsuarioCompra,
      mailUsuarioVenta,
      idNFT,
      idEntrada,
      idEvento,
      idPago
    } = parsedMessage.detail || {};

    // Validar campos obligatorios
    const errores = [];
    if (!mailUsuarioCompra) errores.push("El campo 'mailUsuarioCompra' es obligatorio.");
    if (!mailUsuarioVenta) errores.push("El campo 'mailUsuarioVenta' es obligatorio.");
    if (!idNFT) errores.push("El campo 'idNFT' es obligatorio.");
    if (!idEntrada) errores.push("El campo 'idEntrada' es obligatorio.");
    if (!idEvento) errores.push("El campo 'idEvento' es obligatorio.");
    if (!idPago) errores.push("El campo 'idPago' es obligatorio.");

    if (errores.length > 0) {
      const errorMessage = errores.join(" ");
      console.error("Errores de validación:", errorMessage);
      await logError(
        "Notification",
        errorMessage,
        req.body
      );
      return res.status(400).json({ error: errorMessage });
    }

    // Insertar la reventa en la base de datos
    try {
      const result = await pool.query(
        `INSERT INTO reventas (
          mail_usuario_compra, mail_usuario_venta, id_nft, id_entrada,
          id_evento, id_pago
        ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [mailUsuarioCompra, mailUsuarioVenta, idNFT, idEntrada, idEvento, idPago]
      );

      console.log("Reventa creada exitosamente:", result.rows[0]);
      await logSuccess("Notification", "Reventa creada exitosamente.", result.rows[0]);
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error("Error al crear la reventa:", error.message);
      await logError(
        "Notification",
        "Error al crear la reventa",
        req.body
      );
      res.status(500).json({ error: "Error al crear la reventa" });
    }
  }else{ 
  // Extraer datos del cuerpo de la solicitud
    const {
      idPago,
      estado: originalEstado,
      mailUsuario,
      idEvento,
      valorTotal,
      estadio: originalEstadio,
      cantidadGeneral,
      cantidadVip,
      cantidadIzquierda,
      cantidadDerecha,
    } = parsedMessage.detail || {};

    // Validar que los campos requeridos estén presentes
    const errores = [];
    if (!idPago) errores.push("El campo 'idPago' es obligatorio.");
    if (!mailUsuario) errores.push("El campo 'mailUsuario' es obligatorio.");
    if (!idEvento) errores.push("El campo 'idEvento' es obligatorio.");
    if (!valorTotal) {
      errores.push("El campo 'valorTotal' es obligatorio.");
    }
    const estado = originalEstado !== undefined ? originalEstado : false;
    const estadio = originalEstadio !== undefined ? originalEstadio : 1;
    const precioTotal = valorTotal !== undefined && !isNaN(valorTotal) ? valorTotal : 0;     
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
        mailUsuario,
        idEvento,
        precioTotal,
        estadio,
        cantidadGeneral,
        cantidadVip,
        cantidadIzquierda,
        cantidadDerecha,
      });

      const result = await pool.query(
        `INSERT INTO tickets (
          id_tiket,
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
          mailUsuario,
          idEvento,
          precioTotal,
          estadio,
          cantidadGeneral,
          cantidadVip,
          cantidadIzquierda,
          cantidadDerecha,
        ]
      );

      // Registrar el éxito en la tabla de logs
      try {
        console.log("Tickets creada exitosamente:", result.rows[0]);
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
      "SELECT * FROM tickets WHERE id_tiket = $1",
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
    mailUsuario,
    idEvento,
    valorTotal,
    estadio,
    cantidadGeneral,
    cantidadVip,
    cantidadIzquierda,
    cantidadDerecha,
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
       WHERE id_tiket = $10 RETURNING *`,
      [
        estado,
        mailUsuario,
        idEvento,
        valorTotal.$numberInt,
        estadio.$numberInt,
        cantidadGeneral.$numberInt,
        cantidadVip.$numberInt,
        cantidadIzquierda.$numberInt,
        cantidadDerecha.$numberInt,
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
      "DELETE FROM tickets WHERE id_tiket = $1 RETURNING *",
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
