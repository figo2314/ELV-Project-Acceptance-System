import { PrismaClient } from "@prisma/client";
import { databaseUrl, isPostgresMode } from "./config.js";

let prisma;

export function getPrisma() {
  if (!isPostgresMode) return null;
  if (!databaseUrl) {
    throw Object.assign(new Error("DATABASE_URL is required when DATA_STORE=postgres."), { status: 503 });
  }
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

export async function checkPostgresReady() {
  if (!isPostgresMode) {
    return { ok: true, mode: "json", connected: false };
  }
  if (!databaseUrl) {
    return { ok: false, mode: "postgres", connected: false, error: "DATABASE_URL is not configured." };
  }
  try {
    await getPrisma().$queryRaw`select 1`;
    return { ok: true, mode: "postgres", connected: true };
  } catch (error) {
    return { ok: false, mode: "postgres", connected: false, error: error.message };
  }
}

export async function disconnectPrisma() {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}
