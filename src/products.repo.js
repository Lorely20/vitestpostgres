import { pool } from './db.js';

export async function insertProduct({ name, price, stock }) {
  const { rows } = await pool.query(
    `INSERT INTO products(name, price, stock)
     VALUES ($1, $2, $3)
     RETURNING id, name, price, stock, created_at`,
    [name, price, stock]
  );
  return rows[0];
}

export async function getProductById(id) {
  const { rows } = await pool.query(
    'SELECT id, name, price, stock, created_at FROM products WHERE id = $1',
    [id]
  );
  return rows[0] ?? null;
}

export async function updateProductPrice(id, newPrice) {
  const { rows } = await pool.query(
    `UPDATE products SET price = $2
     WHERE id = $1
     RETURNING id, name, price, stock, created_at`,
    [id, newPrice]
  );
  return rows[0] ?? null;
}

export async function listProductsByPriceRange(min, max) {
  const { rows } = await pool.query(
    `SELECT id, name, price, stock, created_at
     FROM products
     WHERE price BETWEEN $1 AND $2
     ORDER BY price ASC, id ASC`,
    [min, max]
  );
  return rows;
}
