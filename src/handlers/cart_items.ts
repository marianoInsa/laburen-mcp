import { and, eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { cartItemsTable } from '../schemas/cart_items';
import { cartsTable } from '../schemas/carts';
import { productsTable } from '../schemas/products';

export const listCartItems = async (db: D1Database, cartId: number) => {
	const orm = drizzle(db);
	return orm
        .select()
        .from(cartItemsTable)
        .where(eq(cartItemsTable.cart_id, cartId))
        .all();
};

export const addCartItem = async (
	db: D1Database,
	params: { cart_id: number; product_id: string; qty: number }
) => {
	const orm = drizzle(db);
	const { cart_id, product_id, qty } = params;

	const cart = await orm
        .select()
        .from(cartsTable)
        .where(eq(cartsTable.id, cart_id))
        .all();

	if (!cart || cart.length === 0) {
		return { error: 'CART_NOT_FOUND' as const };
	}

	// verificar que el producto exista, esté disponible
	const product = await orm
		.select()
		.from(productsTable)
		.where(
			and(
				eq(productsTable.id, product_id),
				eq(productsTable.available, 1)
			)
		)
		.all();
        
	if (!product || product.length === 0) {
		return { error: 'PRODUCT_NOT_FOUND' as const };
	}

	// verificar que tenga stock suficiente
	if (product[0].stock < qty) {
		return { error: 'INSUFFICIENT_STOCK' as const };
	}

	const stockUpdate = await orm
		.update(productsTable)
		.set({ stock: sql`${productsTable.stock} - ${qty}` })
		.where(
			and(
				eq(productsTable.id, product_id),
				eq(productsTable.available, 1),
				sql`${productsTable.stock} >= ${qty}`
			)
		)
		.returning()
		.all();

	if (!stockUpdate || stockUpdate.length === 0) {
		return { error: 'INSUFFICIENT_STOCK' as const };
	}

	const inserted = await orm
		.insert(cartItemsTable)
		.values({ cart_id, product_id, qty })
		.onConflictDoUpdate({
			target: [cartItemsTable.cart_id, cartItemsTable.product_id],
			set: {
				qty: sql`${cartItemsTable.qty} + ${qty}`,
			},
		})
		.returning()
		.all();

    // actualizar el updated_at del carrito
    await orm
        .update(cartsTable)
        .set({ updated_at: sql`(current_timestamp)` })
        .where(eq(cartsTable.id, cart_id));

	return { item: inserted[0] ?? null };
};

export const removeCartItem = async (
	db: D1Database,
	params: { cart_id: number; product_id: string; qty: number }
) => {
	const orm = drizzle(db);
	const { cart_id, product_id, qty } = params;

	const items = await orm
		.select()
		.from(cartItemsTable)
		.where(
			and(
				eq(cartItemsTable.cart_id, cart_id),
				eq(cartItemsTable.product_id, product_id)
			)
		)
		.all();

	if (!items || items.length === 0) {
		return { error: 'ITEM_NOT_FOUND' as const };
	}

	const currentQty = items[0].qty;

	const removedQty = qty >= currentQty ? currentQty : qty;

	let updated;

	if (qty >= currentQty) {
		// eliminar el item
		
		await orm
			.delete(cartItemsTable)
			.where(
				and(
					eq(cartItemsTable.cart_id, cart_id),
					eq(cartItemsTable.product_id, product_id)
				)
			);

	} else {
		// actualizar la cantidad

		updated = await orm
			.update(cartItemsTable)
			.set({ qty: currentQty - qty })
			.where(
				and(
					eq(cartItemsTable.cart_id, cart_id),
					eq(cartItemsTable.product_id, product_id)
				)
			)
			.returning()
			.all();
	}
	
	await orm
		.update(productsTable)
		.set({ stock: sql`${productsTable.stock} + ${removedQty}` })
		.where(eq(productsTable.id, product_id));

	await orm
		.update(cartsTable)
		.set({ updated_at: sql`(current_timestamp)` })
		.where(eq(cartsTable.id, cart_id));

	return { item: updated ? updated[0] ?? null : null };
};
