import AWS from 'aws-sdk' ;
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();
// Configurar AWS SDK
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken:'IQoJb3JpZ2luX2VjEL7//////////wEaCXVzLXdlc3QtMiJGMEQCICdHDOiIHMQQXOP1e5E+bHHDo+5hrjsJYezaNGf2CiE4AiBcYoOeIHbHUFAqHSqXX9mTBM6OXTD/KdvZqM35QbAYfyq6AghnEAAaDDg0Mjk2MTU4MTcxOSIM4do3XH0X5fPrlRybKpcCL7SEfzfQa55bGBupIMu0x8eVINgapaEc1VXaUGQMFlJx26cI9DZm8Hecv5ni0w/yOq4TwAtqTR/Mc3GMIym6ME3RtvU+VCRaUcAlPNKRtom2ZI+6ol08oX/uTbgFVxxJ5ek7VwCkFCIFJHpoLp2yM0DMJiucH4VOhyWXfSi3t+T9x8aYkXlnhVX0VrTyGOz2AOzktUtSxHG6YqVnOW0Y/BPPry4hfcE27IdJqktzoFiHS+/S1k+9gZe4JWn/WsAUSAAa4FzDzhYghYBw4I+xYVoPpfd2DMiNhsG7WxUk3Gdjkz4NAiSVK2k3ErxlvMOCdmY77yihESM1eapwoqivXzntcJlN/Kc1ukbY8I6yeGTw16gK5gkwMLDVo7oGOp4BKgHA6ap/s1WwaremrdgIc9lTq2LBWau0uSX8MfMQSVpmT3SURBJW5MjY9QxgzzhYfCY4yQWiQQ6fSEG5SifDnkrLCozQRwu1aIqLrtn73yjg6gXbg6QzdJb9mQlCEV1nTv1BZByVaKu+XZbeXTqHIlBLPLjrWIYVTU/9miTrNgARmc+XXoaba7/wXaZ3VkEPU+g0ZoEET7clnxxsnBo=',
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