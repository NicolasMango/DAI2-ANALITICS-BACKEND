import pkg from 'pg';
const { Pool } = pkg;

// PARA AWS 
const pool = new Pool({
  user: 'postgres',
  host: 'analiticadb.cagbs4kerxaw.us-east-1.rds.amazonaws.com',
  database: 'postgres',
  password: 'TpVi3rnes0224!',
  port: 5432,
  ssl: {
    rejectUnauthorized: false // Solo para desarrollo
  },
  // Aumenta los tiempos de conexión
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 10000,
});

/* PARA PROBAR LOCALMENTE 
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'postgres!',
  port: 5432,
});
*/

export default pool;