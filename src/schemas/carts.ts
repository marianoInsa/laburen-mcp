import {
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const cartsTable = sqliteTable(
  "carts",
  {
    id: text().primaryKey().notNull(),
    user_phone: text().notNull(),
    created_at: text().notNull(),
    updated_at: text().notNull()
  }
);