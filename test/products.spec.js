import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { pool, truncateProducts } from '../src/db.js';

async function waitDb(max = 10) {
  for (let i = 0; i < max; i++) {
    try { await pool.query('SELECT 1'); return; }
    catch { await new Promise(r => setTimeout(r, 400)); }
  }
  throw new Error('DB not ready');
}

describe('Products API (Integration) — variante', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await waitDb();
  });

  beforeEach(async () => {
    await truncateProducts();
  });

  afterAll(async () => {
    await pool.end();
  });

  it('GET /health -> 200 OK (status)', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('POST /products y luego GET /products/:id (formato y persistencia)', async () => {
    const create = await request(app)
      .post('/products')
      .send({ name: 'Monitor 24"', price: 125.5, stock: 3 });

    expect(create.status).toBe(201);
    expect(create.body.data).toMatchObject({
      id: expect.any(Number),
      name: 'Monitor 24"',
      price: 125.5,
      stock: 3
    });

    const id = create.body.data.id;
    const get = await request(app).get(`/products/${id}`);

    expect(get.status).toBe(200);
    expect(get.body.data).toMatchObject({
      id,
      name: 'Monitor 24"',
      price: 125.5,
      stock: 3
    });
    expect(new Date(get.body.data.created_at).toString()).not.toBe('Invalid Date');
  });

  it('PATCH /products/:id/price y GET /products?minPrice/maxPrice (cambio real y filtrado)', async () => {
    const p = await request(app).post('/products').send({ name: 'SSD 1TB', price: 80, stock: 5 });
    const id = p.body.data.id;

    const upd = await request(app).patch(`/products/${id}/price`).send({ price: 99.99 });
    expect(upd.status).toBe(200);
    expect(upd.body.data.price).toBe(99.99); 

    const list = await request(app).get('/products').query({ minPrice: 90, maxPrice: 120 });
    expect(list.status).toBe(200);
    // el producto actualizado debe aparecer en el rango [90,120]
    const found = list.body.data.find(x => x.id === id);
    expect(found).toBeTruthy();
    expect(found.price).toBe(99.99);
  });
});
