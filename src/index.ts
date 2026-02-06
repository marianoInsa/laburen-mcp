import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { productsTable } from './schemas/products';

// interfaz para la DB
export type Bindings = {
	DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('/api/*', cors());
app.use(logger());

// health check
app.get('/', (c) => {
	return c.json({
		status: 'ok',
		message: 'Laburen · MCP Server Activo',
	});
});

app.notFound((c) => {
	return c.json({ message: 'Ruta no encontrada' }, 404);
});

// 1 - Explorar productos
// GET /products
app.get('/api/products', async (c) => {
	const db = drizzle(c.env.DB);
	const products = await db.select().from(productsTable).all();
	if (!products) {
		return c.json({ message: 'No se encontraron productos' }, 404);
	}
	return c.json(products);
});

// 2 - Explorar un producto por ID
// GET /products/:id
app.get('/api/products/:id', async (c) => {
	const db = drizzle(c.env.DB);
	const { id } = c.req.param();
	const product = await db.select().from(productsTable).where(eq(productsTable.id, id));
	if (!product) {
		return c.json({ message: 'Producto no encontrado' }, 404);
	}
	return c.json(product);
});

export default app;
