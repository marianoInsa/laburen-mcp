import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { eq, like, and } from 'drizzle-orm';
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
	try {
		const db = drizzle(c.env.DB);
		const products = await db
			.select()
			.from(productsTable)
			.all();
		if (!products) {
			return c.json({ message: 'No se encontraron productos' }, 404);
		}
		return c.json(products);
	} catch (error) {
		console.error('Error en GET /products:', error);
		return c.json({ message: 'Error al obtener productos' }, 500);
	}
});

// 2 - Explorar productos por nombre o color
// GET /products/search?name=Camiseta&color=Rojo
app.get('/api/products/search', async (c) => {
	try {
		const db = drizzle(c.env.DB);
		const { name, color } = c.req.query();

		if (!name && !color) {
			return c.json({ message: 'Se requiere al menos un parámetro de búsqueda' }, 400);
		}

		const products = await db
			.select()
			.from(productsTable)
			.where(
				and(
					name ? like(productsTable.name, `%${name}%`) : undefined,
					color ? like(productsTable.color, `%${color}%`) : undefined
				)
			)
			.all();

		if (!products || products.length === 0) {
			return c.json({ message: 'No se encontraron productos' }, 404);
		}
		return c.json(products);
	} catch (error) {
		console.error('Error en GET /products/search:', error);
		return c.json({ message: 'Error al buscar productos' }, 500);
	}
});

// 3 - Explorar un producto por ID
// GET /products/:id
app.get('/api/products/:id', async (c) => {
	try {
		const db = drizzle(c.env.DB);
		const { id } = c.req.param();
		const products = await db
			.select()
			.from(productsTable)
			.where(eq(productsTable.id, id))
			.all();
		if (!products || products.length === 0) {
			return c.json({ message: 'Producto no encontrado' }, 404);
		}
		return c.json(products[0]);
	} catch (error) {
		console.error('Error en GET /products/:id:', error);
		return c.json({ message: 'Error al obtener producto' }, 500);
	}
});

export default app;
