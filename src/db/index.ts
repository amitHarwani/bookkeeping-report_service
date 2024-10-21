import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "db_service";
import { InferSelectModel } from "drizzle-orm";
import pg from "pg";

/* DB Client */
const queryClient = postgres(process.env.DB_URL as string);

export const db = drizzle(queryClient, { schema, logger: true });

export type User = InferSelectModel<typeof schema.users>;
export type Report = InferSelectModel<typeof schema.reports>

const { Pool } = pg;

const pool = new Pool();

export const query = async (
    text: string,
    params: any,
    callback: (err: Error, result: pg.QueryResult<any>) => void
) => {
    return pool.query(text, params, callback);
};


export const getClient = () => {
    return pool.connect();
}