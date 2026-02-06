import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import productsRoutes from './routes/products';
import cartsRoutes from './routes/carts';
import cartItemsRoutes from './routes/cart_items';

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
app.route('/api/carts', cartsRoutes);
app.route('/api/cart-items', cartItemsRoutes);

export default app;
