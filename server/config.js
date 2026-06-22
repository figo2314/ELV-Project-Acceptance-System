export const dataStore = normalizeDataStore(process.env.DATA_STORE || "json");
export const isPostgresMode = dataStore === "postgres";
export const databaseUrl = process.env.DATABASE_URL || "";
export const startupMode = {
  dataStore,
  databaseConfigured: Boolean(databaseUrl)
};

function normalizeDataStore(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (["postgres", "postgresql", "prisma"].includes(normalized)) return "postgres";
  return "json";
}
