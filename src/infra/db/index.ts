// ─── Database connection singleton ─────────────────────────────────────────

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import { env } from "@/infra/env";

const client = postgres(env.DATABASE_URL);

export const db = drizzle(client, { schema });
export { schema };
