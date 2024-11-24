import express from "express";
const router = express.Router();
import fetch from 'node-fetch'; 
import pool from "../db.js";

// Crear un nuevo ticket
router.post("/", async (req, res) => {
  console.log("Headers:", req.headers);
  console.log('Cuerpo recibido:', req.body);
  const messageType = req.headers["x-amz-sns-message-type"];
  const message = req.body;
  console.log('Tipo de mensaje:', messageType);
  if (messageType === "SubscriptionConfirmation") {
    const confirmUrl = message.SubscribeURL;

    try {
      console.log(message)
      console.log(
        `Confirmando suscripción para el tópico: ${message.TopicArn}`
      );
      await fetch(confirmUrl); // Realiza un GET al SubscribeURL para confirmar
      console.log("Suscripción confirmada exitosamente.");
    } catch (error) {
      console.error(`Error al confirmar la suscripción: ${error.message}`);
      return res.status(500).send("Error al confirmar la suscripción");
    }
  }

  // Manejar notificaciones
  if (messageType === "Notification") {
    console.log("Notificación recibida:", message);
    // Procesa la notificación si es necesario
    const {
      idEntrada,
      idPago,
      idEvento,
      idUsuario,
      nombreEvento,
      fechaEvento,
      sector,
      precioPago,
      promotor,
    } = req.body;
  
    if (
      !idEntrada ||
      !idUsuario ||
      !nombreEvento ||
      !fechaEvento ||
      !precioPago
    ) {
      return res
        .status(400)
        .json({
          error:
            "idEntrada, idUsuario, nombreEvento, fechaEvento y precioPago son obligatorios",
        });
    }

    try {
      console.log("Valores recibidos:");
      console.log("idEntrada:", idEntrada);
      console.log("idPago:", idPago);
      console.log("idEvento:", idEvento);
      console.log("idUsuario:", idUsuario);
      console.log("nombreEvento:", nombreEvento);
      console.log("fechaEvento:", fechaEvento);
      console.log("sector:", sector);
      console.log("precioPago:", precioPago);
      console.log("promotor:", promotor);

      const result = await pool.query(
        `INSERT INTO tickets (idEntrada, idPago, idEvento, idUsuario, nombreEvento, fechaEvento, sector, precioPago, promotor) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [
          idEntrada,
          idPago,
          idEvento,
          idUsuario,
          nombreEvento,
          fechaEvento,
          sector,
          precioPago,
          promotor,
        ]
      );
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error("Error al crear el ticket:", error);
      res.status(500).json({ error: "Error al crear el ticket" });
    }
  }
});

// Obtener todos los tickets
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM tickets");
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error al obtener los tickets:", error);
    res.status(500).json({ error: "Error al obtener los tickets" });
  }
});

// Obtener un ticket por idEntrada
router.get("/:idEntrada", async (req, res) => {
  const { idEntrada } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM tickets WHERE idEntrada = $1",
      [idEntrada]
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

// Actualizar un ticket por idEntrada
router.put("/:idEntrada", async (req, res) => {
  const { idEntrada } = req.params;
  const {
    idPago,
    idEvento,
    idUsuario,
    nombreEvento,
    fechaEvento,
    sector,
    precioPago,
    promotor,
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE tickets SET 
         idPago = $1, 
         idEvento = $2, 
         idUsuario = $3, 
         nombreEvento = $4, 
         fechaEvento = $5, 
         sector = $6, 
         precioPago = $7,
         promotor = $8
       WHERE idEntrada = $9 RETURNING *`,
      [
        idPago,
        idEvento,
        idUsuario,
        nombreEvento,
        fechaEvento,
        sector,
        precioPago,
        promotor,
        idEntrada,
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

// Eliminar un ticket por idEntrada
router.delete("/:idEntrada", async (req, res) => {
  const { idEntrada } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM tickets WHERE idEntrada = $1 RETURNING *",
      [idEntrada]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Ticket no encontrado" });
    }
    res
      .status(200)
      .json({
        message: "Ticket eliminado correctamente",
        ticket: result.rows[0],
      });
  } catch (error) {
    console.error("Error al eliminar el ticket:", error);
    res.status(500).json({ error: "Error al eliminar el ticket" });
  }
});

export default router;
