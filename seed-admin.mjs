// One-time seed script — run with: node --env-file=.env seed-admin.mjs
import { createHash, randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const email = "support@jetechltd.com.ng";
const password = "Jetech5%";

const existing = await prisma.adminUser.findUnique({ where: { email } });
const id = existing?.id ?? randomUUID();
const hash = createHash("sha256").update(password + id).digest("hex");

const user = await prisma.adminUser.upsert({
  where: { email },
  update: { passwordHash: hash },
  create: { id, email, passwordHash: hash },
});

console.log(`Admin user seeded: ${user.email} (${user.id})`);
await prisma.$disconnect();
