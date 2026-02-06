import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { cartsTable } from '../schemas/carts';

export const createCart = async (db: D1Database, user_phone: string) => {
	const orm = drizzle(db);
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
        .where(eq(cartsTable.id, id))
        .all();
};
