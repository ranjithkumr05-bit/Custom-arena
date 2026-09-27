/**
 * Delete the local database so it is rebuilt empty on next start.
 * Cross-platform — `rm` does not exist on Windows.
 *
 *   npm run reset:db
 */
import { existsSync, rmSync, readdirSync } from "fs";
import { join } from "path";

const dir = join(process.cwd(), "data");
if (!existsSync(dir)) {
  console.log("No data/ directory — nothing to reset.");
  process.exit(0);
}

const removed = readdirSync(dir).filter((f) => f.startsWith("customapparel.db"));
for (const f of removed) rmSync(join(dir, f), { force: true });

console.log(
  removed.length
    ? `Removed ${removed.length} file(s): ${removed.join(", ")}\nA fresh database is created on next start.`
    : "Database already clear."
);
