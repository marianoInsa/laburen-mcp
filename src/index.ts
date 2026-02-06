import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import productsRoutes from './routes/products';

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

app.route('/api/products', productsRoutes);

export default app;
