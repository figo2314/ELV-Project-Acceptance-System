import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const databaseUrl = process.env.DATABASE_URL;
const backupRoot = path.resolve(rootDir, process.env.BACKUP_DIR || "backups");
const uploadDir = path.resolve(rootDir, process.env.UPLOAD_DIR || "data/uploads");
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupDir = path.join(backupRoot, stamp);

if (!databaseUrl) {
  console.error("DATABASE_URL is required for production backup.");
  process.exitCode = 1;
} else {
  await mkdir(backupDir, { recursive: true });

  const databaseDump = path.join(backupDir, "postgres.dump");
  const uploadsArchive = path.join(backupDir, "uploads.tar.gz");
  const manifestPath = path.join(backupDir, "manifest.json");

  await run("pg_dump", [
    "--format=custom",
    "--no-owner",
    "--no-privileges",
    "--file",
    databaseDump,
    databaseUrl
  ]);

  await run("tar", [
    "-czf",
    uploadsArchive,
    "-C",
    path.dirname(uploadDir),
    path.basename(uploadDir)
  ]);

  const manifest = {
    createdAt: new Date().toISOString(),
    databaseDump: path.basename(databaseDump),
    uploadsArchive: path.basename(uploadsArchive),
    uploadDir,
    dataStore: process.env.DATA_STORE || "",
    note: "Restore both postgres.dump and uploads.tar.gz to recover a complete production state."
  };
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(JSON.stringify({ ok: true, backupDir, ...manifest }, null, 2));
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
