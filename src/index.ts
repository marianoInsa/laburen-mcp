import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { StreamableHTTPTransport } from '@hono/mcp';
import mcpServer, { setMcpEnv } from './mcp';

// interfaz para la DB
export type Bindings = {
	DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();
const mcpTransport = new StreamableHTTPTransport();

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

// MCP endpoint
app.all('/mcp', async (c) => {
	setMcpEnv(c.env);
	if (!mcpServer.isConnected()) {
		await mcpServer.connect(mcpTransport);
	}
	return mcpTransport.handleRequest(c);
});

export default app;
