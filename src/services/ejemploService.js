import AWS from 'aws-sdk' ;
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();
// Configurar AWS SDK
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken:'IQoJb3JpZ2luX2VjEFsaCXVzLXdlc3QtMiJHMEUCIQCXaEdh5HsPa5eHEdM57bE0znouPXMRs3rwsAVzeK/hfwIgc4VqZauoshR3Vt6Csd/KyCetS8MyZ6PnzHqpX42FcZgqwwII9P//////////ARAAGgw4NDI5NjE1ODE3MTkiDHFnO3/p2+Ttx++TxiqXAq2pLq8maOFrfgmfI1hv/2efIJeJFZ1wMCjeqXfPruRez7a2u0SeBGqA6b6MU5Ub/LojUgAfXTxVWtnnawLCLFzc9RVd/Il3ZXgWaGQptF0KY9lf4xkRSrkVIS6UUyFzIJJxGGHqdr/qW7F1LwtrZU6Mv67lX5MTJAKDrwDT0XW1hCspGk3gFyeBqERByYz0l71kitP7kgee+FxGBS2VldWAStsNN6BYAbduhtWMHoMIkgpAJ/OqQPdfpWMkH272fgLaV4aQ09L5sOzhsIu8qhvmWvzbaEjsYw7PfkMjsCVyREGYm9KkYwFya2/LMY2h2a2DRBdUyo5KRAScDGlGH0oL+IGJgd02rS2wpGbmLpUqHsKn7SxYYzCh9Y26BjqdARF47NoVC6zqu7wzvO3/FqqDUkRf4gVnf/uqloD3altcEl5q9097ZnK4AZY3QbKhJeiWAUAAj4lk+aKABXJXPOQm6iqKc/yFiFPiBBtyJq8TfTkUDX5QIdybOhsDpw/iS6njNU/ME9hi1naFpcMGS5MrutiB+JqMFZC0XC/Y9uk797atNV4NekaOo5kdgd8eBvwYr96LG860Hg10h5Q=',
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