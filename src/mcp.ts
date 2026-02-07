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
    'create_cart',
    {
        description: 'Crear un carrito y agregar el primer item',
        inputSchema: z.object({
            user_phone: z.string(),
            product_id: z.string(),
            qty: z.number().int().positive(),
        }),
    },
    async ({ user_phone, product_id, qty }) => {
        const cart = await createCart(getDb(), user_phone);
        if (!cart) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({ error: 'Creación de carrito fallida' }),
                    },
                ],
            };
        }

        const result = await addCartItem(getDb(), {
            cart_id: cart.id,
            product_id,
            qty,
        });

        const payload =
            'error' in result
                ? { cart_id: cart.id, error: result.error }
                : { cart_id: cart.id, item: result.item };

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(payload),
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