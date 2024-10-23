import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  host: 'database-1.cagbs4kerxaw.us-east-1.rds.amazonaws.com',
  database: 'yourdatabase',
  password: 'TpVi3rnes0224!',
  port: 5432,
});

export default pool;