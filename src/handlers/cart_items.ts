import { eq, sql } from 'drizzle-orm';
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
        .where(eq(cartsTable.id, cart_id));

	if (!cart || cart.length === 0) {
		return { error: 'CART_NOT_FOUND' as const };
	}

	const product = await orm
		.select()
		.from(productsTable)
		.where(eq(productsTable.id, product_id));
        
	if (!product || product.length === 0) {
		return { error: 'PRODUCT_NOT_FOUND' as const };
	}

	const inserted = await orm
		.insert(cartItemsTable)
		.values({ cart_id, product_id, qty })
		.returning();

    // actualizar el updated_at del carrito
    await orm
        .update(cartsTable)
        .set({ updated_at: sql`(current_timestamp)` })
        .where(eq(cartsTable.id, cart_id));

	return { item: inserted[0] ?? null };
};
