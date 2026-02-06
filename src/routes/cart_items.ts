import { Hono } from 'hono';
import type { Bindings } from '../index';
import { addCartItem, listCartItems, removeCartItem } from '../handlers/cart_items';

const cartItemsRoutes = new Hono<{ Bindings: Bindings }>();

// 1 - Listar items por carrito
// GET /cart-items?cart_id=1
cartItemsRoutes.get('/', async (c) => {
	try {
		const cartId = Number(c.req.query('cart_id'));
		if (!Number.isFinite(cartId)) {
			return c.json({ message: 'Se requiere el parámetro "cart_id" numérico' }, 400);
		}

		const items = await listCartItems(c.env.DB, cartId);
		return c.json(items);
	} catch (error) {
		console.error('Error en GET /cart-items:', error);
		return c.json({ message: 'Error al obtener items del carrito' }, 500);
	}
});

// 2 - Agregar item
// POST /cart-items { cart_id, product_id, qty }
cartItemsRoutes.post('/', async (c) => {
	try {
		const body = await c.req.json<{ cart_id?: number; product_id?: string; qty?: number }>();
		if (!body?.cart_id || !body?.product_id || !body?.qty) {
			return c.json({ message: 'Se requieren "cart_id", "product_id" y "qty"' }, 400);
		}

		const result = await addCartItem(c.env.DB, {
			cart_id: body.cart_id,
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

		return c.json(result.item, 201);
	} catch (error) {
		console.error('Error en POST /cart-items:', error);
		return c.json({ message: 'Error al agregar item al carrito' }, 500);
	}
});

// 3 - Eliminar item
// DELETE /cart-items { cart_id, product_id, qty }
cartItemsRoutes.delete('/', async (c) => {
	try {
		const body = await c.req.json<{ cart_id?: number; product_id?: string; qty?: number }>();
		if (!body?.cart_id || !body?.product_id) {
			return c.json({ message: 'Se requieren "cart_id" y "product_id"' }, 400);
		}

		const qty = body.qty ?? 1;
		if (!Number.isFinite(qty) || qty <= 0) {
			return c.json({ message: 'El campo "qty" debe ser mayor a 0' }, 400);
		}

		const result = await removeCartItem(c.env.DB, {
			cart_id: body.cart_id,
			product_id: body.product_id,
			qty,
		});

		if ('error' in result && result.error === 'ITEM_NOT_FOUND') {
			return c.json({ message: 'Item no encontrado en el carrito' }, 404);
		}

		return c.json({ item: result.item }, 200);
	} catch (error) {
		console.error('Error en DELETE /cart-items:', error);
		return c.json({ message: 'Error al eliminar item del carrito' }, 500);
	}
});

export default cartItemsRoutes;
