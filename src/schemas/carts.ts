import { sql } from 'drizzle-orm';
import {
  sqliteTable,
  text,
  integer,
} from "drizzle-orm/sqlite-core";

export const cartsTable = sqliteTable(
  "carts",
  {
    id: integer().primaryKey({ autoIncrement: true }),
    user_phone: text().notNull(),
    created_at: text().notNull().default(sql`CURRENT_TIMESTAMP`),
    updated_at: text().notNull().default(sql`CURRENT_TIMESTAMP`),
    deleted_at: text()
  }
);