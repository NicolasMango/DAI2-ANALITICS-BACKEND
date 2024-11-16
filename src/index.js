import express from "express";
import cors from 'cors';
import bodyParser from 'body-parser';
import ticketRoutes from './routes/tickets.routes.js';
import artistaRoutes from './routes/artistas.routes.js';
import eventoRoutes from './routes/eventos.routes.js';
import usuariosRoutes from './routes/usuarios.routes.js';
import predecirRoutes from './routes/predecir.routes.js';
import pool from './db.js';

const PORT = process.env.PORT || 8000;

const app = express();
app.use(cors());
app.options('*', cors());
app.use(bodyParser.json());

app.get("/ping", async (_req, res) => {
  res.send({
    message: "pong",
  });
});
app.use('/tickets', ticketRoutes);
app.use('/artistas', artistaRoutes);
app.use('/eventos', eventoRoutes);
app.use('/usuarios', usuariosRoutes);
app.use('/predecir' , predecirRoutes);

import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './swagger-output.json' assert {type :"json"};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));


app.listen(PORT, () => {
  console.log("Server is running on port", PORT);
});





