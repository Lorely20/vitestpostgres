import 'dotenv/config';
import pkg from 'pg';
const { Pool, types } = pkg;

types.setTypeParser(1700, (val) => (val === null ? null : parseFloat(val)));

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export async function truncateProducts() {
  await pool.query('TRUNCATE TABLE products RESTART IDENTITY CASCADE;');
}
