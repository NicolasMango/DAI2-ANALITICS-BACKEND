import AWS from 'aws-sdk' ;
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();
// Configurar AWS SDK
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken:'IQoJb3JpZ2luX2VjEKX//////////wEaCXVzLXdlc3QtMiJHMEUCIQDztPIxs2ymokQV2qA+cb4b9YJzqpkAINN4SqcEDnWtswIgVj7nS32r+TMtAXUTNhuoduaiHbxJRqEgSXoO2JR0HnoqugIIThAAGgw4NDI5NjE1ODE3MTkiDAGVDNaxoa9y3UGYviqXAlyRK8E7iEtxMK+EuyC+6Lk/Tp+Lq+P7ba6nkmEK/TrH4TpgtccmiryTiFUs2H6urJDjFbxb1SD0KHjKcgw98QM2mcAHRmbdGWXbMLVziuDtsIfZwFUydZ2SMTsYGjlsTSqnw9fG5YDmGD2dYJ/Z8C+LM9AzqRlFdcSkRaid6pkv2CLcdqu5etgCwrWviquau6nP3qKDVHh1aeH6EgGIsy5IMO/yzK04uWodNwfw1ysmEiVg16azZidrbYoPwKMb3yhCKBHJ2td6HK7bI5ijdjj7mAZw/UYMNogC3X9/yn9ORPGgAATE2kj3DeHj3E4vWWRjTsieZfUUU1t43p4jx91ae6ZcLggVtOSa9UVFziQVF6Ws1FqBBDC+kp66BjqdAQ5TXPFqM+Dp3nyx4FanB0xzNyLfQtCZD6HtptplCrPgx7IHOvh8jLVBo8h83wztpyFo7vjP95PAv5h8Agd6T4sQ1jMXiKfSe+nAmsCZpJKXgKGsOg3S0FYoReVNjSVJY/Hiii0kgfTL3hlJ/8hVbTCH2Y33HFdn1AOy4K7wRNRAXqnor8j4+xVaqQYPHVmHR6XCBSshmAwfCh4oR7I=',
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