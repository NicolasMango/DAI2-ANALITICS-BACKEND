import AWS from 'aws-sdk' ;
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();
// Configurar AWS SDK
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken:'IQoJb3JpZ2luX2VjEKn//////////wEaCXVzLXdlc3QtMiJHMEUCIQDZpcgN29WuIB68Xh+fWHZa8dz6j/DBAEnZGxDEqKiiTgIgQo5qMqj3JCW5eA9eUzadTYxfhrvbJxWyw6ogEhcxDKQqugIIUhAAGgw4NDI5NjE1ODE3MTkiDOa+l8kenTOdm1x9kiqXAhQkdPsMjJ8sN1sQztoEuerg0qmtU54TJhQLTNPEtR+iVxNBQrMvxRw8acb/JBmvOkRvjc/kdeI5A7Try2SxQK2EGdOinCAa8CN4HYILuQcDQaWvu341mxAeRcJoB2yoAiK3bhA0fIu76a7N0mHupg+lP/faBGQodN8DlNioc1xnA1gIAbICioMwNVaqdMybN2Jb4CgBxUHjNZ4FOn4/49CVYTPKbiSbAuT6XgTVYppd2wT926yqvAA0fI/OyVkcms4cDLPjy9kybIIgm9tg3lYetul7gTqgoOnTG/fcUbMX1tA0i1s2zZ3A3ra3/qG7vlDMsJjBPnLMEu9YlHRfaU0DwTwghlxDWlV20WoWtFTBpRloR7AlsTCMhp+6BjqdAbk2tD/X8EIoIb6qKQEueeymXR/Dib/CEHibwMwxy4wTVgT4KqzK/RJVJZtg8bWWYyxFlI5iAKZAnZ4KxhaB8Y3AxdJmO7hq19LblEWUa6bnzYgOFATMROmcuqvEHIOPtJtRk+wu8JVn5eO6IneDnjW3fJkX1SvpOOSpaAunepvkAVCn+Q40YSsnq6wZVdSSZanACdJ7iU9PT8qJOZE=',
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
          console.log('para el endpoint ', matchingEndpoint.endpoint )
        } catch (err) {
          console.error(`Error suscribiéndose al tópico ${topicArn}:`, err.message);
        }
      }
  } catch (error) {
    console.error('Error obteniendo la lista de tópicos:', error.message);
  }
}

export default ejemplosubscribeToTopics;