import express from "express";
import cors from 'cors';
import bodyParser from 'body-parser';
import ticketRoutes from './routes/tickets.routes';
import lugarRoutes from './routes/lugares.routes';
import artistaRoutes from './routes/artistas.routes';
import eventoRoutes from './routes/eventos.routes';
import compradorRoutes from './routes/compradores.routes';

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
app.use('/lugares', lugarRoutes);
app.use('/artistas', artistaRoutes);
app.use('/eventos', eventoRoutes);
app.use('/compradores', compradorRoutes);


app.listen(PORT, () => {
  console.log("Server is running on port", PORT);
});





