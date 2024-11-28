import AWS from 'aws-sdk' ;
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();
// Configurar AWS SDK
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken:'IQoJb3JpZ2luX2VjEHUaCXVzLXdlc3QtMiJIMEYCIQDTpS6c6/b1Oqn5euKag7AzhLUdylR+ol0p6fEXBhgvSgIhAMFPS9ZBAUgC6wqq2bwyGQh4X6kgQwKf+BbwZKps2H/3KroCCB4QABoMODQyOTYxNTgxNzE5IgxF4MHuDn2LUUSyOeMqlwLxytk8olWwhVlHUPWKrqHf6uOGc1+lRDytg90hC7Oi02ySYKkYFYVdoL4FbOZJsN3Cql6/F1RZ68FUVhnRpoHyt5FpPO3dU6N+U/F7S+r4EKH7/Xm5THsriHKlCVhwNVV204ssUL5dzzjz4Xy4m7berR7VT/CUbi+ZrRcttkB9eW71+Kvtwr9Fpb4A/r4f9kl3BuWvzj9S1nbZe6sGN3nB86wSzPaLoW5w0+XCM4v1hRm0Kad/NOsbQurIs8s3Agg8yTPTibFQ9KtGYEmbTmrxKxL+UioqKUA4m2oG3+41L9Ldr2gueze6KUxq8pqNzlF5m76RKL+UgHwjATr/PNWFkwQo6qjqQJkTzeHwXBpgN2LOX9SersEwts+TugY6nAEOp+DcKss85kpOM9nR1l9vjfsQpP6rDCdTfahFAK5Fr+vYrLqVIJzn4KhUaYlWcMG8gek2sms8bLBw/XXg7TGsBiYSYOLpLBSTr2buofUfyTXMJ634aZSVSteKQvo3vhqsq/R1ONxLrrc9dXEqIOc6jr4yBjquxUSIcpq9yZsQQHIh73FKa/beDVKh3oCom3Srk9v/BdyGHtpLF6s=',
    region: process.env.AWS_REGION,
});
 
// Crear instancia de SNS
const sns = new AWS.SNS();
 
const topicEndpointMap = [
    {
      arn: "arn:aws:sns:us-east-1:442042507897:ticket-topic",
      endpoint: "https://analyticsapi.deliver.ar/api/tickets",
    },
    {
      arn: "arn:aws:sns:us-east-1:442042507897:artist-topic",
      endpoint: "https://analyticsapi.deliver.ar/api/artistas",
    },
    {
      arn: "arn:aws:sns:us-east-1:442042507897:recital-topic",
      endpoint: "https://analyticsapi.deliver.ar/api/eventos",
    },
  ];

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
 
    for (const topic of topics) {
        const topicArn = topic.TopicArn;
  
        // Buscar el endpoint correspondiente al TopicArn
        const matchingEndpoint = topicEndpointMap.find((item) => item.arn === topicArn);
  
        if (!matchingEndpoint) {
          console.warn(`No se encontró un endpoint para el tópico ${topicArn}.`);
          continue;
        }
  
        // Crear suscripción HTTPS
        const params = {
          Protocol: "https", // Protocolo HTTPS
          TopicArn: topicArn,
          Endpoint: matchingEndpoint.endpoint, // Endpoint correspondiente
        };
  
        try {
          const subscription = await sns.subscribe(params).promise();
          console.log(
            `Suscripción exitosa: ${subscription.SubscriptionArn} para el tópico: ${topicArn}`
          );
        } catch (err) {
          console.error(`Error suscribiéndose al tópico ${topicArn}:`, err.message);
        }
      }
  } catch (error) {
    console.error('Error obteniendo la lista de tópicos:', error.message);
  }
}

export default ejemplosubscribeToTopics;