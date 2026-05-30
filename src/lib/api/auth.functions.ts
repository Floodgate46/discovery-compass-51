import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { setCookie, getCookie } from "@tanstack/react-start/server";

const SESSION_COOKIE = "dc_admin_session";

function getSecret() {
  return process.env.SESSION_SECRET ?? "discovery-compass-secret-change-in-prod";
}

// Simple signed session: base64(payload).signature
async function signPayload(payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return Buffer.from(sig).toString("base64url");
}

async function createSessionToken(userId: string): Promise<string> {
  const payload = Buffer.from(JSON.stringify({ userId, exp: Date.now() + 86400_000 * 7 })).toString("base64url");
  const sig = await signPayload(payload);
  return `${payload}.${sig}`;
}

async function verifySessionToken(token: string): Promise<string | null> {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = await signPayload(payload);
  if (expected !== sig) return null;
  try {
    const { userId, exp } = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (Date.now() > exp) return null;
    return userId as string;
  } catch {
    return null;
  }
}

export const loginAdmin = createServerFn({ method: "POST" })
  .inputValidator(z.object({ email: z.string().email(), password: z.string().min(1) }))
  .handler(async ({ data }) => {
    const { prisma } = await import("./prisma.server");
    const user = await prisma.adminUser.findUnique({ where: { email: data.email } });
    if (!user) return { ok: false, error: "Invalid credentials" };

    const { createHash } = await import("node:crypto");
    const hash = createHash("sha256").update(data.password + user.id).digest("hex");
    if (hash !== user.passwordHash) return { ok: false, error: "Invalid credentials" };

    const token = await createSessionToken(user.id);
    setCookie(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 86400 * 7,
      path: "/",
    });
    return { ok: true };
  });

export const logoutAdmin = createServerFn({ method: "POST" }).handler(async () => {
  setCookie(SESSION_COOKIE, "", { maxAge: 0, path: "/" });
  return { ok: true };
});

export const getAdminSession = createServerFn({ method: "GET" }).handler(async () => {
  const token = getCookie(SESSION_COOKIE);
  if (!token) return { userId: null };
  const userId = await verifySessionToken(token);
  return { userId };
});

export const seedAdminUser = createServerFn({ method: "POST" })
  .inputValidator(z.object({ email: z.string().email(), password: z.string().min(8), secret: z.string() }))
  .handler(async ({ data }) => {
    if (data.secret !== process.env.ADMIN_SEED_SECRET) return { ok: false, error: "Forbidden" };
    const { prisma } = await import("../prisma.server");
    const { createHash, randomUUID } = await import("node:crypto");
    const existing = await prisma.adminUser.findUnique({ where: { email: data.email } });
    const id = existing?.id ?? randomUUID();
    const hash = createHash("sha256").update(data.password + id).digest("hex");
    const user = await prisma.adminUser.upsert({
      where: { email: data.email },
      update: { passwordHash: hash },
      create: { id, email: data.email, passwordHash: hash },
    });
    return { ok: true, id: user.id };
  });
