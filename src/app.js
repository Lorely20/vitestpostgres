import express from 'express';
import { pool } from './db.js';
import {
  insertProduct,
  getProductById,
  updateProductPrice,
  listProductsByPriceRange
} from './products.repo.js';

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => res.status(200).json({ ok: true }));

app.post('/products', async (req, res) => {
  const { name, price, stock = 0 } = req.body ?? {};
  if (!name || typeof name !== 'string' || typeof price !== 'number' || !Number.isInteger(stock) || stock < 0) {
    return res.status(400).json({ error: 'payload inválido' });
  }
  const created = await insertProduct({ name, price, stock });
  res.status(201).json({ data: created });
});

app.get('/products/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'id inválido' });
  const prod = await getProductById(id);
  if (!prod) return res.status(404).json({ error: 'not found' });
  res.status(200).json({ data: prod });
});

app.patch('/products/:id/price', async (req, res) => {
  const id = Number(req.params.id);
  const { price } = req.body ?? {};
  if (!Number.isInteger(id) || typeof price !== 'number' || price < 0) {
    return res.status(400).json({ error: 'payload inválido' });
  }
  const updated = await updateProductPrice(id, price);
  if (!updated) return res.status(404).json({ error: 'not found' });
  res.status(200).json({ data: updated });
});

app.get('/products', async (req, res) => {
  const min = req.query.minPrice !== undefined ? Number(req.query.minPrice) : 0;
  const max = req.query.maxPrice !== undefined ? Number(req.query.maxPrice) : 999999999;
  const list = await listProductsByPriceRange(min, max);
  res.status(200).json({ data: list });
});


if (process.env.NODE_ENV !== 'test') {
  const port = Number(process.env.PORT) || 3002;
  app.listen(port, () => console.log(`API on http://localhost:${port}`));
}


pool.query('SELECT 1').catch((e) => {
  console.error('DB connection failed', e);
  process.exit(1);
});

export default app;
