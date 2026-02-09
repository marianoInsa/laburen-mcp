import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import z from 'zod';
import { listProducts, searchProductsByName, getProductById, listTypesOfClothing } from './handlers/products';
import { createCart, getActiveCartByUserPhone } from './handlers/carts';
import { addCartItem, removeCartItem, listCartItems } from './handlers/cart_items';

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
    'list_types_of_clothing',
    {
        description: 'Listar los tipos de indumentaria disponibles (valores unicos de products.name).',
        inputSchema: z.object({}),
    },
    async () => {
        const names = await listTypesOfClothing(getDb());
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(names),
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
    'update_cart',
    {
        description: 'Agregar o quitar items del carrito segun qty (positivo suma, negativo resta)',
        inputSchema: z.object({
            cart_id: z.number().int(),
            product_id: z.string(),
            qty: z.number().int().refine((value) => value !== 0),
        }),
    },
    async ({ cart_id, product_id, qty }) => {
        const result = qty > 0
            ? await addCartItem(getDb(), { cart_id, product_id, qty })
            : await removeCartItem(getDb(), { cart_id, product_id, qty: Math.abs(qty) });

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
    'list_cart_items',
    {
        description: 'Listar items del carrito por cart_id o por user_phone (carrito activo).',
        inputSchema: z.object({
            cart_id: z.number().int().optional(),
            user_phone: z.string().optional(),
        }),
    },
    async ({ cart_id, user_phone }) => {
        if (!cart_id && !user_phone) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({ error: 'Se requiere cart_id o user_phone' }),
                    },
                ],
            };
        }

        let resolvedCartId = cart_id;
        if (!resolvedCartId && user_phone) {
            const carts = await getActiveCartByUserPhone(getDb(), user_phone);
            if (!carts || carts.length === 0) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({ error: 'CART_NOT_FOUND' }),
                        },
                    ],
                };
            }
            resolvedCartId = carts[0].id;
        }

        const items = await listCartItems(getDb(), resolvedCartId!);
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

export default mcpServer;