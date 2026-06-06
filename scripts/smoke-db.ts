import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  unlinkSync,
} from "node:fs";
import path from "node:path";
import { createDatabase } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";

export async function createSmokeDatabase() {
  if (process.env.TURSO_DATABASE_URL) {
    return createDatabase();
  }

  const dbPath =
    process.env.SMOKE_DATABASE_PATH ??
    path.join(process.cwd(), ".tmp", `local-smoke-${process.pid}.db`);
  mkdirSync(path.dirname(dbPath), { recursive: true });
  removeIfExists(dbPath);
  const client = createClient({ url: `file:${dbPath}` });

  await applyMigrations(client);

  return drizzle(client, { schema });
}

function removeIfExists(dbPath: string) {
  for (const file of [dbPath, `${dbPath}-shm`, `${dbPath}-wal`]) {
    if (existsSync(file)) {
      unlinkSync(file);
    }
  }
}

async function applyMigrations(client: ReturnType<typeof createClient>) {
  const migrationFiles = readdirSync(path.join(process.cwd(), "drizzle"))
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of migrationFiles) {
    const migration = readFileSync(
      path.join(process.cwd(), "drizzle", file),
      "utf8",
    );
    const statements = migration
      .split("--> statement-breakpoint")
      .map((statement) => statement.trim())
      .filter(Boolean);

    for (const statement of statements) {
      await client.execute(statement);
    }
  }
}
