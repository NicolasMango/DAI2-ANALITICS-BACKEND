import { SNSClient, SubscribeCommand, ListSubscriptionsByTopicCommand } from '@aws-sdk/client-sns';

const snsClient = new SNSClient({
    region: 'us-east-1',
    credentials: {
      accessKeyId: 'ASIA4IRDM62L5U24IHAZ',
      secretAccessKey: '+NyP9OZgIZ+YSixNvkgUx+t6SolS9MhrFn8SgyBb',
    },
    logger:console
});

const topics = [
  {
    arn: 'arn:aws:sns:us-east-1:442042507897:ticket-topic',
    endpoint: 'https://analyticsapi.deliver.ar/api/tickets',
  },
  {
    arn: 'arn:aws:sns:us-east-1:442042507897:artist-topic',
    endpoint: 'https://analyticsapi.deliver.ar/api/artistas',
  },
  {
    arn: 'arn:aws:sns:us-east-1:442042507897:recital-topic',
    endpoint: 'https://analyticsapi.deliver.ar/api/eventos',
  },
];

const checkIfSubscriptionExists = async (topicArn, endpoint) => {
  try {
    const command = new ListSubscriptionsByTopicCommand({ TopicArn: topicArn });
    const response = await snsClient.send(command);

    return response.Subscriptions.some(
      (sub) => sub.Endpoint === endpoint && sub.SubscriptionArn !== 'PendingConfirmation'
    );
  } catch (error) {
    console.error(`Error verificando suscripciones en el tópico ${topicArn}:`, error.message);
    return false;
  }
};

const subscribeToTopics = async () => {
  for (const topic of topics) {
    const { arn, endpoint } = topic;

    // Verificar si ya existe una suscripción para este endpoint
    const alreadySubscribed = await checkIfSubscriptionExists(arn, endpoint);

    if (alreadySubscribed) {
      console.log(`El endpoint ${endpoint} ya está suscrito al tópico ${arn}.`);
      continue; // Evitar duplicados
    }

    // Crear la suscripción si no existe
    const params = {
      Protocol: 'https', // Usa HTTPS para endpoints seguros
      TopicArn: arn,
      Endpoint: endpoint,
    };

    try {
      const command = new SubscribeCommand(params);
      const response = await snsClient.send(command);
      console.log(`Suscripción creada para el tópico ${arn}:`);
      console.log(`Subscription ARN: ${response.SubscriptionArn}`);
    } catch (error) {
      console.log(error);
      console.error(`Error al suscribir el endpoint ${endpoint} al tópico ${arn}:`, error.message);
      console.error('Detailed error:', {
        message: error.message,
        code: error.Code,
        type: error.Type,
        requestId: error.$metadata?.requestId,
        statusCode: error.$metadata?.httpStatusCode,
        stack: error.stack
      });
    }
  }
};

export default subscribeToTopics;
