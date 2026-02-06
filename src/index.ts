import { Hono } from 'hono';
import { cors } from 'hono/cors';

// interfaz para la DB
type Bindings = {
	DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('/api/*', cors());

// health check
app.get('/', (c) => {
	return c.json({
		status: 'ok',
		message: 'Laburen · MCP Server Activo',
	});
});

// 1 - Explorar productos
// GET /products
app.get('/api/products', async (c) => {
	try {
		let query = 'SELECT * FROM products WHERE available = 1';
		let params: any[] = [];

		// limito a 5 resultados
		query += ' LIMIT 5';

		const { results } = await c.env.DB.prepare(query)
			.bind(...params)
			.all();

		return c.json({ products: results });
	} catch (error) {
		return c.json(
			{
				error: 'Error al buscar productos',
				details: String(error),
			},
			500,
		);
	}
});

export default app;
