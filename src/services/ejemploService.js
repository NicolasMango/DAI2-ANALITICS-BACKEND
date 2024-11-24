import AWS from 'aws-sdk' ;
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();
// Configurar AWS SDK
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});
 
// Crear instancia de SNS
const sns = new AWS.SNS();
 
async function ejemplosubscribeToTopics() {
  try {
    // Obtener tópicos dinámicos desde el endpoint
    const response = await axios.get('https://edaapi.deliver.ar/v1/health');
    const topics = response.data?.resources?.topics;
 
    if (!topics || topics.length === 0) {
      console.error('No hay tópicos para suscribirse.');
      return;
    }
    console.log(process.env.AWS_ACCESS_KEY_ID);
    console.log(process.env.AWS_SECRET_ACCESS_KEY);
    const endpointUrl = 'https://analyticsapi.deliver.ar/api/tickets'; // Cambia al endpoint de tu backend
 
    for (const topic of topics) {
      const topicArn = topic.TopicArn;
 
      // Crear suscripción HTTPS
      const params = {
        Protocol: 'https', // Protocolo HTTPS
        TopicArn: topicArn,
        Endpoint: endpointUrl, // URL de tu endpoint HTTPS
      };
 
      try {
        const subscription = await sns.subscribe(params).promise();
        console.log(`Suscripción exitosa: ${subscription.SubscriptionArn} para el tópico: ${topicArn}`);
      } catch (err) {
        console.error(`Error suscribiéndose al tópico ${topicArn}:`, err.message);
      }
    }
  } catch (error) {
    console.error('Error obteniendo la lista de tópicos:', error.message);
  }
}

export default ejemplosubscribeToTopics;