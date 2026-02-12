import { env, SELF } from 'cloudflare:test';
import { beforeEach, describe, expect, it } from 'vitest';

const schemaSql = `
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS carts;
DROP TABLE IF EXISTS products;

CREATE TABLE products (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	talla TEXT NOT NULL,
	color TEXT NOT NULL,
	stock INTEGER NOT NULL,
	price_50_u REAL NOT NULL,
	price_100_u REAL NOT NULL,
	price_200_u REAL NOT NULL,
	available INTEGER NOT NULL,
	category TEXT NOT NULL,
	description TEXT NOT NULL
);

CREATE TABLE carts (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	user_phone TEXT NOT NULL UNIQUE,
	created_at TEXT DEFAULT CURRENT_TIMESTAMP,
	updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
	deleted_at TEXT
);

CREATE TABLE cart_items (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	cart_id INTEGER,
	product_id TEXT,
	qty INTEGER NOT NULL,
	UNIQUE(cart_id, product_id),
	FOREIGN KEY(cart_id) REFERENCES carts(id) ON DELETE CASCADE,
	FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS cart_items_cart_id_product_id_unique
ON cart_items (cart_id, product_id);
`;

const seedSql = `
INSERT INTO products (
    id, name, talla, color, stock, price_50_u, price_100_u, price_200_u,
    available, category, description
) VALUES
    ('prod-1', 'Remera Azul', 'M', 'Azul', 10, 100, 90, 80, 1, 'remeras', 'Remera azul basica'),
    ('prod-2', 'Remera Roja', 'L', 'Rojo', 10, 110, 95, 85, 0, 'remeras', 'Remera roja no disponible'),
    ('prod-3', 'Gorra Verde', 'U', 'Verde', 2, 50, 45, 40, 1, 'accesorios', 'Gorra verde con stock limitado');
`;

const runSql = async (sql: string) => {
	const statements = sql
		.split(';')
		.map((statement) => statement.trim())
		.filter((statement) => statement.length > 0);

	for (const statement of statements) {
		await env.DB.prepare(statement).run();
	}
};

const resetDb = async () => {
	await runSql(schemaSql);
	await runSql(seedSql);
};

const parseMcpResponse = async (response: Response) => {
	const contentType = response.headers.get('content-type') ?? '';
	if (contentType.includes('text/event-stream')) {
		const text = await response.text();
		const dataLines = text
			.split('\n')
			.map((line) => line.trim())
			.filter((line) => line.startsWith('data: '))
			.map((line) => line.replace('data: ', '').trim())
			.filter((line) => line && line !== '[DONE]');
		const last = dataLines.at(-1);
		if (!last) {
			throw new Error('MCP response vacia');
		}
		return JSON.parse(last);
	}

	return response.json();
};

const callMcpTool = async (name: string, args: Record<string, unknown>) => {
	const payload = {
		jsonrpc: '2.0',
		id: crypto.randomUUID(),
		method: 'tools/call',
		params: {
			name,
			arguments: args,
		},
	};

	const response = await SELF.fetch('https://example.com/mcp', {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
			accept: 'application/json, text/event-stream',
		},
		body: JSON.stringify(payload),
	});
	const decoded = await parseMcpResponse(response);
	if ('error' in decoded) {
		throw new Error(decoded.error?.message ?? 'MCP error');
	}
	return decoded.result as { content: Array<{ type: string; text: string }> };
};

describe('MCP tools', () => {
	beforeEach(async () => {
		await resetDb();
	});

	it('list_products devuelve solo disponibles por defecto', async () => {
		const result = await callMcpTool('list_products', {});
		const parsed = JSON.parse(result.content[0].text) as Array<{ id: string }>;
		const ids = parsed.map((item) => item.id).sort();
		expect(ids).toEqual(['prod-1', 'prod-3']);
	});

	it('list_products devuelve error cuando el producto no esta disponible', async () => {
		const result = await callMcpTool('list_products', { product_id: 'prod-2' });
		const parsed = JSON.parse(result.content[0].text) as Array<{ error?: string }>;
		expect(parsed[0].error).toContain('prod-2');
	});

	it('list_products devuelve error cuando no hay match por nombre', async () => {
		const result = await callMcpTool('list_products', { name: 'Inexistente' });
		const parsed = JSON.parse(result.content[0].text) as Array<{ error?: string }>;
		expect(parsed[0].error).toContain('Inexistente');
	});

	it('create_cart crea carrito y agrega item', async () => {
		const result = await callMcpTool('create_cart', {
			user_phone: '1122334455',
			product_id: 'prod-1',
			qty: 2,
		});
		const payload = JSON.parse(result.content[0].text) as {
			cart_id: number;
			item?: { qty: number } | null;
			error?: string;
		};
		expect(payload.cart_id).toBeTypeOf('number');
		expect(payload.error).toBeUndefined();
		expect(payload.item?.qty).toBe(2);
	});

	it('create_cart devuelve error si supera el stock (limite)', async () => {
		const result = await callMcpTool('create_cart', {
			user_phone: '1199988877',
			product_id: 'prod-3',
			qty: 3,
		});
		const payload = JSON.parse(result.content[0].text) as {
			cart_id: number;
			error?: string;
		};
		expect(payload.cart_id).toBeTypeOf('number');
		expect(payload.error).toBe('INSUFFICIENT_STOCK');
	});

	it('update_cart permite quitar todo el item cuando qty es negativo', async () => {
		const create = await callMcpTool('create_cart', {
			user_phone: '1100000000',
			product_id: 'prod-1',
			qty: 2,
		});
		const createdPayload = JSON.parse(create.content[0].text) as { cart_id: number };
		const result = await callMcpTool('update_cart', {
			cart_id: createdPayload.cart_id,
			product_id: 'prod-1',
			qty: -2,
		});
		const payload = JSON.parse(result.content[0].text) as { item: unknown };
		expect(payload.item).toBeNull();
	});

	it('update_cart devuelve error si el item no existe (limite)', async () => {
		const create = await callMcpTool('create_cart', {
			user_phone: '1100002222',
			product_id: 'prod-1',
			qty: 1,
		});
		const createdPayload = JSON.parse(create.content[0].text) as { cart_id: number };
		const result = await callMcpTool('update_cart', {
			cart_id: createdPayload.cart_id,
			product_id: 'prod-3',
			qty: -1,
		});
		const payload = JSON.parse(result.content[0].text) as { error?: string };
		expect(payload.error).toBe('ITEM_NOT_FOUND');
	});

	it('update_cart devuelve error si supera el stock (limite)', async () => {
		const create = await callMcpTool('create_cart', {
			user_phone: '1199911111',
			product_id: 'prod-1',
			qty: 1,
		});
		const createdPayload = JSON.parse(create.content[0].text) as { cart_id: number };
		const result = await callMcpTool('update_cart', {
			cart_id: createdPayload.cart_id,
			product_id: 'prod-3',
			qty: 5,
		});
		const payload = JSON.parse(result.content[0].text) as { error?: string };
		expect(payload.error).toBe('INSUFFICIENT_STOCK');
	});
});
