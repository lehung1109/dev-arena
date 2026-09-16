import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Fallback connection string ensures test environments & CI can instantiate the Drizzle schema without throwing
const connectionString =
  process.env.DATABASE_URL || "postgresql://mock_user:mock_pass@localhost:5432/dev_arena_mock";

const sql = neon(connectionString);

export const db = drizzle(sql, { schema });
export { schema };
