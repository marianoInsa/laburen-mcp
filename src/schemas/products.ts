import {
  sqliteTable,
  integer,
  text,
  real,
} from "drizzle-orm/sqlite-core";

export const productsTable = sqliteTable(
  "products",
  {
    id: text().primaryKey().notNull(),
    name: text().notNull(),
    talla: text().notNull(),
    color: text().notNull(),
    stock: integer().notNull(),
    price_50_u: real().notNull(),
    price_100_u: real().notNull(),
    price_200_u: real().notNull(),
    available: integer().notNull(),
    category: text().notNull(),
    description: text().notNull()
  }
);