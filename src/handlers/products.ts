import { eq, like, and } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { productsTable } from '../schemas/products';

export const listProducts = async (db: D1Database) => {
	const orm = drizzle(db);
	return orm.select().from(productsTable).all();
};

export const searchProductsByName = async (
    db: D1Database, 
    name: string
) => {
    const orm = drizzle(db);
    return orm
        .select()
        .from(productsTable)
        .where(like(productsTable.name, `%${name}%`))
        .all();
}

export const getProductById = async (db: D1Database, id: string) => {
	const orm = drizzle(db);
	return orm.select().from(productsTable).where(eq(productsTable.id, id)).all();
};
