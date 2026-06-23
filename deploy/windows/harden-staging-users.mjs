import { readFile } from "node:fs/promises";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const credentialPath = process.env.STAGING_CREDENTIALS_PATH;
if (!credentialPath) {
  throw new Error("STAGING_CREDENTIALS_PATH is required.");
}

const credentials = JSON.parse((await readFile(credentialPath, "utf8")).replace(/^\uFEFF/, ""));
const prisma = new PrismaClient();
const rounds = Number(process.env.BCRYPT_ROUNDS || 12);

try {
  const updatedUsers = [];
  for (const entry of Object.values(credentials.applicationUsers || {})) {
    if (!entry?.username || !entry?.password) {
      throw new Error("The staging credential file has an invalid application user entry.");
    }
    const user = await prisma.user.update({
      where: { username: String(entry.username).toLowerCase() },
      data: {
        passwordHash: await bcrypt.hash(String(entry.password), rounds),
        mustChangePassword: false,
        failedLoginCount: 0,
        lockedUntil: null,
        passwordChangedAt: new Date()
      },
      select: { username: true, role: true }
    });
    updatedUsers.push(user);
  }
  await prisma.session.deleteMany();
  console.log(JSON.stringify({ ok: true, updatedUsers, sessionsCleared: true }, null, 2));
} finally {
  await prisma.$disconnect();
}
