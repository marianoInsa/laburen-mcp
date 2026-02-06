import {
  sqliteTable,
  integer,
  text,
} from "drizzle-orm/sqlite-core";
import { productsTable } from "./products";
import { cartsTable } from "./carts";

export const cartItemsTable = sqliteTable(
  "cart_items",
  {
    id: integer().primaryKey().notNull(),
    cart_id: text().notNull().references(() => cartsTable.id),
    product_id: text().notNull().references(() => productsTable.id),
    qty: integer().notNull()
  },
);