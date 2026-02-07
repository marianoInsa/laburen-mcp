import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import z from 'zod';
import { listProducts, searchProductsByName, getProductById } from './handlers/products';
import { createCart, getCartById, deleteCartById } from './handlers/carts';
import { addCartItem, listCartItems, removeCartItem } from './handlers/cart_items';

type McpEnv = {
    DB: D1Database;
};

let currentEnv: McpEnv | null = null;

export const setMcpEnv = (env: McpEnv) => {
    currentEnv = env;
};

const getDb = () => {
    if (!currentEnv) {
        throw new Error('MCP env no inicializado');
    }
    return currentEnv.DB;
};

const mcpServer = new McpServer({
    name: 'Laburen · MCP Server',
    description: 'Servidor MCP para la plataforma Laburen',
    version: '1.0.0',
});

mcpServer.registerTool(
    'list_products',
    {
        description: 'Listar todos los productos disponibles o filtrar por nombre. Si se proporciona product_id, buscar por ID un producto específico.',
        inputSchema: z.object({
            product_id: z.string().optional(),
            name: z.string().optional(),
        }),
    },
    async ({ product_id, name }) => {
        let products = [];
        if (product_id) {
            products = await getProductById(getDb(), product_id, true);
        } else if (name) {
            products = await searchProductsByName(getDb(), name, true);
        } else {
            products = await listProducts(getDb(), true);
        }
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(products),
                },
            ],
        };
    }
);

mcpServer.registerTool(
    'carts.create',
    {
        description: 'Crear un carrito',
        inputSchema: z.object({
            user_phone: z.string(),
        }),
    },
    async ({ user_phone }) => {
        const cart = await createCart(getDb(), user_phone);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(cart),
                },
            ],
        };
    }
);

mcpServer.registerTool(
    'carts.getById',
    {
        description: 'Obtener un carrito por ID',
        inputSchema: z.object({
            id: z.number().int(),
        }),
    },
    async ({ id }) => {
        const carts = await getCartById(getDb(), id);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(carts),
                },
            ],
        };
    }
);

mcpServer.registerTool(
    'carts.deleteById',
    {
        description: 'Eliminar (soft delete) un carrito por ID',
        inputSchema: z.object({
            id: z.number().int(),
        }),
    },
    async ({ id }) => {
        const result = await deleteCartById(getDb(), id);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(result),
                },
            ],
        };
    }
);

mcpServer.registerTool(
    'cartItems.list',
    {
        description: 'Listar items de un carrito',
        inputSchema: z.object({
            cart_id: z.number().int(),
        }),
    },
    async ({ cart_id }) => {
        const items = await listCartItems(getDb(), cart_id);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(items),
                },
            ],
        };
    }
);

mcpServer.registerTool(
    'cartItems.add',
    {
        description: 'Agregar un item al carrito',
        inputSchema: z.object({
            cart_id: z.number().int(),
            product_id: z.string(),
            qty: z.number().int().positive(),
        }),
    },
    async ({ cart_id, product_id, qty }) => {
        const result = await addCartItem(getDb(), { cart_id, product_id, qty });
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(result),
                },
            ],
        };
    }
);

mcpServer.registerTool(
    'cartItems.remove',
    {
        description: 'Eliminar o restar cantidad de un item del carrito',
        inputSchema: z.object({
            cart_id: z.number().int(),
            product_id: z.string(),
            qty: z.number().int().positive(),
        }),
    },
    async ({ cart_id, product_id, qty }) => {
        const result = await removeCartItem(getDb(), { cart_id, product_id, qty });
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(result),
                },
            ],
        };
    }
);

export default mcpServer;