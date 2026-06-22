import { spawn } from "node:child_process";
import { access, mkdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const databaseUrl = process.env.DATABASE_URL;
const uploadDir = path.resolve(rootDir, process.env.UPLOAD_DIR || "data/uploads");
const backupDir = path.resolve(rootDir, process.argv[2] || "");
const confirmed = process.argv.includes("--confirm");

if (!databaseUrl) {
  fail("DATABASE_URL is required for production restore.");
} else if (!process.argv[2]) {
  fail("Usage: npm run restore:production -- <backup-dir> --confirm");
} else if (!confirmed) {
  fail("Restore is destructive. Re-run with --confirm after verifying the backup directory.");
} else {
  const manifestPath = path.join(backupDir, "manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const databaseDump = path.join(backupDir, manifest.databaseDump || "postgres.dump");
  const uploadsArchive = path.join(backupDir, manifest.uploadsArchive || "uploads.tar.gz");
  await access(databaseDump);
  await access(uploadsArchive);

  await run("pg_restore", [
    "--clean",
    "--if-exists",
    "--no-owner",
    "--no-privileges",
    "--dbname",
    databaseUrl,
    databaseDump
  ]);

  await mkdir(path.dirname(uploadDir), { recursive: true });
  await rm(uploadDir, { recursive: true, force: true });
  await run("tar", [
    "-xzf",
    uploadsArchive,
    "-C",
    path.dirname(uploadDir)
  ]);

  console.log(JSON.stringify({
    ok: true,
    restoredFrom: backupDir,
    databaseDump: manifest.databaseDump,
    uploadsArchive: manifest.uploadsArchive,
    uploadDir
  }, null, 2));
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", shell: process.platform === "win32" });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} exited with code ${code}`));
    });
  });
}
