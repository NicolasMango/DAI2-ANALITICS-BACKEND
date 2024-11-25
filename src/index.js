import express from "express";
import cors from 'cors';
import bodyParser from 'body-parser';
import ticketRoutes from './routes/tickets.routes.js';
import artistaRoutes from './routes/artistas.routes.js';
import eventoRoutes from './routes/eventos.routes.js';
import usuariosRoutes from './routes/usuarios.routes.js';
import predecirRoutes from './routes/predecir.routes.js';
import loginRoutes from './routes/login.routes.js';
import subscribeToTopics from './services/snsService.js';
import ejemplosubscribeToTopics from './services/ejemploService.js'       
import cookieParser from "cookie-parser";

const PORT = process.env.PORT || 8000;

const app = express();
app.use(cors({ credentials: true }));
app.use(cookieParser());
app.options('*', cors());

app.use((req, res, next) => {
  const contentType = req.headers['content-type'] || '';

  if (contentType.includes('application/json')) {
    express.json()(req, res, next); // Procesa JSON
  } else if (contentType.includes('text/plain')) {
    express.text()(req, res, next); // Procesa texto plano
  } else {
    next(); // Pasa al siguiente middleware si el Content-Type no coincide
  }
});

app.get("/health", async (_req, res) => {
  res.status(200).send({
    ok: true,
    message: "Ok",
  });
});
app.get("/subscribirEjemplo", async (_req, res) => {
  try {
    await ejemplosubscribeToTopics(); 
    res.status(200).send({
      ok: true,
      message: "Subscriptions successful",
    });
  } catch (error) {
    console.error('Error during subscription:', error.message);
    res.status(500).send({
      ok: false,
      message: "Error subscribing to topics",
      error: error.message,
    });
  }
});

app.get("/subscribir", async (_req, res) => {
  try {
    await subscribeToTopics(); 
    res.status(200).send({
      ok: true,
      message: "Subscriptions successful",
    });
  } catch (error) {
    console.error('Error during subscription:', error.message);
    res.status(500).send({
      ok: false,
      message: "Error subscribing to topics",
      error: error.message,
    });
  }
});
app.use('/tickets', ticketRoutes);
app.use('/artistas', artistaRoutes);
app.use('/eventos', eventoRoutes);
app.use('/usuarios', usuariosRoutes);
app.use('/predecir' , predecirRoutes);

const loginCorsOptions = {
  origin: 'https://analytics.deliver.ar',
  credentials: true,
};

app.use('/login', cors(loginCorsOptions), loginRoutes);

// import swaggerUi from 'swagger-ui-express';
// import swaggerDocument from './swagger-output.json' assert {type :"json"};

// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));


app.listen(PORT, () => {
  console.log("Server is running on port", PORT);
});





