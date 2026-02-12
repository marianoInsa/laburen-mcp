import { eq, and, isNull, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { cartsTable } from '../schemas/carts';

export const createCart = async (db: D1Database, user_phone: string) => {
	const orm = drizzle(db);

    const existingCart = await orm
        .select()
        .from(cartsTable)
        .where(eq(cartsTable.user_phone, user_phone))
        .all();

    if (existingCart.length > 0) {
        const cart = existingCart[0];

        if (cart.deleted_at) {
            const restored = await orm
                .update(cartsTable)
                .set({ deleted_at: null, updated_at: sql`CURRENT_TIMESTAMP` })
                .where(eq(cartsTable.id, cart.id))
                .returning()
                .all();
            return restored[0] ?? cart;
        }
        
        return cart;
    }

	const inserted = await orm
		.insert(cartsTable)
		.values({ user_phone })
		.returning()
		.all();
	return inserted[0] ?? null;
};

export const getCartById = async (db: D1Database, id: number) => {
	const orm = drizzle(db);
	return orm
        .select()
        .from(cartsTable)
        .where(
            and(
                eq(cartsTable.id, id),
                isNull(cartsTable.deleted_at)
            )
        )
        .all();
};

export const getActiveCartByUserPhone = async (db: D1Database, user_phone: string) => {
    const orm = drizzle(db);
    return orm
        .select()
        .from(cartsTable)
        .where(
            and(
                eq(cartsTable.user_phone, user_phone),
                isNull(cartsTable.deleted_at)
            )
        )
        .all();
};

export const deleteCartById = async (db: D1Database, id: number) => {
    // Soft delete: set deleted_at timestamp
    const orm = drizzle(db);
    const result = await orm
        .update(cartsTable)
        .set({ deleted_at: new Date().toISOString() })
        .where(
            and(
                eq(cartsTable.id, id),
                isNull(cartsTable.deleted_at)
            )
        );
    return result;
};