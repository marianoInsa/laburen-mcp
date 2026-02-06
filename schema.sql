DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS carts;
DROP TABLE IF EXISTS products;

-- tabla de productos
CREATE TABLE products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    talla TEXT NOT NULL,
    color TEXT NOT NULL,
    stock INTEGER NOT NULL,
    price_50_u REAL NOT NULL,
    price_100_u REAL NOT NULL,
    price_200_u REAL NOT NULL,
    available INTEGER NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL
);

-- tabla de carritos
CREATE TABLE carts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_phone TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- actualizar updated_at al modificar un carrito
CREATE TRIGGER update_cart_timestamp
AFTER UPDATE ON carts
FOR EACH ROW
BEGIN
    UPDATE carts SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- tabla de items del carrito
CREATE TABLE cart_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cart_id INTEGER,
    product_id TEXT,
    qty INTEGER NOT NULL,
    FOREIGN KEY(cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
);