import AWS from 'aws-sdk' ;
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();
// Configurar AWS SDK
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken:'IQoJb3JpZ2luX2VjEFcaCXVzLXdlc3QtMiJGMEQCIGysuHChH9YV4iWjchTbxwKPD8IN+CtilB49jceEmMWlAiBwlu/GIP0PhBPEmQ2LL+LsjEpV4/cVRtw4oUnRH7QF7CrDAgjw//////////8BEAAaDDg0Mjk2MTU4MTcxOSIMEcCc3f/CoxJfL20nKpcCm3ALbIB8cKWcwnB30HzDyIbc283BLYM1QTPda+D4zwqGzYKittxjwJS4qaBYrfEdaCHfqrAW3eSPEZHZpLBC9yXaNkr1aCE5y9I66np0n6lOiS157XAiO86cevlM2PtWCvRct2chpIklImEOhgHWD5sYMZO4rPAD2AaQHFyGGZeH1mNn2GyLptOaJmy3f8SDdo4dmhfQkKV7I+ZIX+DoMpt6jIL4hRDGIBv/dAydKp4bgP8eBye9o+SfU0LFW3OfBg3nFLub2ClTCywiJITMXGiVf0KzzKQAxtP2NYrTlZJQNFpI/ljUay33g3X8ViL81ZhphSQ5F42nF+e1TXXMQg6plQyWPpz1GeT53e8/CL8qb7tq1o10MML9jLoGOp4BkGUhVT7U3tVUELgaKPhuI24piJQEPIOr/aGBaJBJRgJob7xD05P/qHiQU9HhVUt9GQYtFsIMVslvHTJtJp5xAXOPEIoie5tL6cPtYCXKWpHylGcTNeHDVipWlnKdrjPdclOHWB511MqB7X5tV3XVnDIQI2J1YplYr1/ecSWesu1BX0L8SVhKwVn7Mipb7INZ9jPI+gpFPs25k8p0dFQ=',
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