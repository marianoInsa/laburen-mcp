import { Hono } from 'hono';
import type { Bindings } from '../index';
import { createCart, getCartById, deleteCartById } from '../handlers/carts';
import { addCartItem } from '../handlers/cart_items';

const cartsRoutes = new Hono<{ Bindings: Bindings }>();

// 1 - Crear carrito
// POST /carts { user_phone, product_id, qty }
cartsRoutes.post('/', async (c) => {
	try {
		const body = await c.req.json<{ user_phone?: string; product_id?: string; qty?: number }>();
		if (!body?.user_phone || !body?.product_id || !body?.qty) {
			return c.json({ message: 'Se requieren los campos "user_phone", "product_id" y "qty"' }, 400);
		}

        // crear carrito
		const cart = await createCart(c.env.DB, body.user_phone);
		if (!cart) {
			return c.json({ message: 'No se pudo crear el carrito' }, 500);
		}

        // crear primer item del carrito
        const result = await addCartItem(c.env.DB, {
			cart_id: cart.id,
			product_id: body.product_id,
			qty: body.qty,
		});

        if ('error' in result) {
			if (result.error === 'CART_NOT_FOUND') {
				return c.json({ message: 'Carrito no encontrado' }, 404);
			}
			if (result.error === 'PRODUCT_NOT_FOUND') {
				return c.json({ message: 'Producto no encontrado' }, 404);
			}
		}

		return c.json(cart, 201);
	} catch (error) {
		console.error('Error en POST /carts:', error);
		return c.json({ message: 'Error al crear carrito' }, 500);
	}
});

// 2 - Obtener carrito por ID
// GET /carts/:id
cartsRoutes.get('/:id', async (c) => {
	try {
		const id = Number(c.req.param('id'));
		if (!Number.isFinite(id)) {
			return c.json({ message: 'El parámetro "id" debe ser numérico' }, 400);
		}

		const carts = await getCartById(c.env.DB, id);
		if (!carts || carts.length === 0) {
			return c.json({ message: 'Carrito no encontrado' }, 404);
		}

		return c.json(carts[0]);
	} catch (error) {
		console.error('Error en GET /carts/:id:', error);
		return c.json({ message: 'Error al obtener carrito' }, 500);
	}
});

// 3 - Eliminar carrito por ID
// DELETE /carts/:id
cartsRoutes.delete('/:id', async (c) => {
    try {
        const id = Number(c.req.param('id'));
        if (!Number.isFinite(id)) {
            return c.json({ message: 'El parámetro "id" debe ser numérico' }, 400);
        }

		const result = await deleteCartById(c.env.DB, id);
		if (!result || result.meta.changes === 0) {
			return c.json({ message: 'Carrito no encontrado' }, 404);
		}
        
        return c.json({ message: 'Carrito eliminado correctamente' });
    } catch (error) {
        console.error('Error en DELETE /carts/:id:', error);
        return c.json({ message: 'Error al eliminar carrito' }, 500);
    }
});


export default cartsRoutes;
