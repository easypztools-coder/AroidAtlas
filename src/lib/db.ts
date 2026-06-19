import { createPool, VercelPool } from "@vercel/postgres";

let pool: VercelPool | null = null;

export function getDbPool(): VercelPool {
  if (!pool) {
    const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        "Missing POSTGRES_URL or DATABASE_URL environment variables for database connection."
      );
    }
    pool = createPool({
      connectionString,
    });
  }
  return pool;
}

export async function query(text: string, params?: any[]) {
  const db = getDbPool();
  return db.query(text, params);
}
