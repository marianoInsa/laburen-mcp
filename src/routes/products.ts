import { Hono } from 'hono';
import { getProductById, listProducts, searchProductsByName } from '../handlers/products';
import type { Bindings } from '../index';

const productsRoutes = new Hono<{ Bindings: Bindings }>();

// 1 - Explorar productos
// GET /products
productsRoutes.get('/', async (c) => {
	try {
		const products = await listProducts(c.env.DB);

		if (!products) {
			return c.json({ message: 'No se encontraron productos' }, 404);
		}

		return c.json(products);
	} catch (error) {
		console.error('Error en GET /products:', error);
		return c.json({ message: 'Error al obtener productos' }, 500);
	}
});

// 2 - Explorar productos por nombre
// GET /products/name/:name
productsRoutes.get('/name/:name', async (c) => {
    try {
        const { name } = c.req.param();

        if (!name) {
            return c.json({ message: 'Se requiere el parámetro de búsqueda "name"' }, 400);
        }

        const products = await searchProductsByName(c.env.DB, name);

        if (!products || products.length === 0) {
            return c.json({ message: 'No se encontraron productos' }, 404);
        }
        return c.json(products);
    } catch (error) {
        console.error('Error en GET /products/name:', error);
        return c.json({ message: 'Error al buscar productos por nombre' }, 500);
    }
});

// 3 - Explorar un producto por ID
// GET /products/:id
productsRoutes.get('/:id', async (c) => {
	try {
		const { id } = c.req.param();

        if (!id) {
            return c.json({ message: 'Se requiere el parámetro "id"' }, 400);
        }

		const product = await getProductById(c.env.DB, id);

		if (!product) {
			return c.json({ message: 'Producto no encontrado' }, 404);
		}

		return c.json(product);
	} catch (error) {
		console.error('Error en GET /products/:id:', error);
		return c.json({ message: 'Error al obtener producto' }, 500);
	}
});

export default productsRoutes;
