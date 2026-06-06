import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { requireDatabaseUrl } from "@/lib/config/env";
import * as schema from "@/lib/db/schema";

export function createDatabase(options = requireDatabaseUrl()) {
  const client = createClient({
    url: options.url,
    authToken: options.authToken,
  });

  return drizzle(client, { schema });
}

export type Database = ReturnType<typeof createDatabase>;

