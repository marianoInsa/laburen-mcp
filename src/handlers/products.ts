import { eq, like, and } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { productsTable } from '../schemas/products';

export const listProducts = async (db: D1Database, available: boolean = false) => {
	const orm = drizzle(db);
	return available 
        ? orm.select().from(productsTable).where(eq(productsTable.available, 1)).all()
        : orm.select().from(productsTable).all();
};

export const listTypesOfClothing = async (db: D1Database) => {
    const orm = drizzle(db);
    return orm.selectDistinct({ name: productsTable.name }).from(productsTable).all();
};

export const searchProductsByName = async (
    db: D1Database, 
    name: string,
    available: boolean = false
) => {
    const orm = drizzle(db);
    const product = available
        ? await orm.select().from(productsTable).where(
            and(
                like(productsTable.name, `%${name}%`),
                eq(productsTable.available, 1)
            )
        ).all()
        : await orm.select().from(productsTable).where(
            like(productsTable.name, `%${name}%`)
        ).all();

    if (product.length === 0 && available) {
        return [{
            error: `No se encontraron productos disponibles del tipo "${name}".`
        }];
    }
    
    return product;
}

export const getProductById = async (db: D1Database, id: string, available: boolean = false) => {
	const orm = drizzle(db);
    const product = available
        ? await orm.select().from(productsTable).where(
            and(
                eq(productsTable.id, id),
                eq(productsTable.available, 1)
            )
        ).all()
        : await orm.select().from(productsTable).where(
            eq(productsTable.id, id)
        ).all();
    
    if (product.length === 0 && available) {
        return [{
            error: `Producto con ID ${id} no disponible.`
        }];
    }

	return product;
};
