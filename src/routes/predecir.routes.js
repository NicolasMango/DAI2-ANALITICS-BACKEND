import axios from 'axios';
import express from 'express';
const router = express.Router();
// Definir los datos del evento
const evento = {
    Evento: 'Monster Of Rock',
    Artista: 'Metallica',
    Lugar: 'Teatro Vorterix',
    Capacidad: 100000,
    'Precio Promedio': 720,
    Promoción: 'Alta',
    VentasPasadas: 8000,
    Año: 2024,
    Mes: 10,
    Día_Semana: 3,
    Días_Hasta_Evento: 15
};
console.log(evento);
router.post('/', async (req, res) => {
    try {
        //const evento = req.body;  // Suponiendo que el cliente envía los datos en el cuerpo de la solicitud
        
        // Enviar la solicitud POST a la API de Flask
        const response = await axios.post('http://localhost:5000/predecir', evento);
        
        // Imprimir la predicción en la consola
        console.log(response.data)
        console.log(`Predicción de ventas: ${response.data.prediccion}`);
        
        // Enviar la respuesta al cliente con la predicción de ventas
        res.json({
            message: "Predicción de ventas obtenida con éxito",
            prediccion: response.data.prediccion
        });
    } catch (error) {
        // Manejar errores y enviar un mensaje adecuado al cliente
        console.error('Error al hacer la predicción:', error);
        
        res.status(500).json({
            message: "Error al procesar la predicción",
            error: error.message
        });
    }
});
// Enviar una solicitud POST a la API de Flask


export default router;