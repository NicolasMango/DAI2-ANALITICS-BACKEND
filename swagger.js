import swaggerAutogen from 'swagger-autogen';

const doc = {
  info: {
    title: 'Analitics Backend',
    description: 'Backend Node para el modulo de analitics TPO DAI2'
  },
  host: 'localhost:8000'
};

const outputFile = './swagger-output.json';
const routes = ['./src/index.js'];

/* NOTE: If you are using the express Router, you must pass in the 'routes' only the 
root file where the route starts, such as index.js, app.js, routes.js, etc ... */

swaggerAutogen(outputFile, routes, doc);