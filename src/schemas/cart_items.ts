import {
  sqliteTable,
  integer,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { productsTable } from "./products";
import { cartsTable } from "./carts";

export const cartItemsTable = sqliteTable(
  "cart_items",
  {
    id: integer().primaryKey({ autoIncrement: true }),
    cart_id: integer().notNull().references(() => cartsTable.id),
    product_id: text().notNull().references(() => productsTable.id),
    qty: integer().notNull()
  },
  (table) => [
    uniqueIndex("cart_items_cart_id_product_id_unique").on(
      table.cart_id,
      table.product_id
    )
  ]
);
