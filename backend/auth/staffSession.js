import crypto from "node:crypto";

const COOKIE_NAME = "freshmart_staff";
const SESSION_SECONDS = 8 * 60 * 60;

function secret() {
  const value = process.env.SESSION_SECRET;
  if (value) return value;
  if (process.env.NODE_ENV === "production") {
    throw new Error("Set the SESSION_SECRET environment variable");
  }
  return "dev-only-session-secret";
}

function sign(payload) {
  return crypto
    .createHmac("sha256", secret())
    .update(`staff:${payload}`)
    .digest("hex");
}

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}

export function createStaffSession(res, employeeId) {
  const expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const payload = `${employeeId}.${expires}`;
  res.cookie(COOKIE_NAME, `${payload}.${sign(payload)}`, {
    ...cookieOptions(),
    maxAge: SESSION_SECONDS * 1000,
  });
}

export function clearStaffSession(res) {
  res.clearCookie(COOKIE_NAME, cookieOptions());
}

export function readStaffSession(req) {
  const cookie = (req.headers.cookie || "")
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_NAME}=`));
  if (!cookie) return null;
  const parts = cookie.slice(COOKIE_NAME.length + 1).split(".");
  if (parts.length !== 3) return null;
  const [id, expires, signature] = parts;
  if (!/^[1-9]\d*$/.test(id) || !/^\d+$/.test(expires)) return null;
  if (!Number.isSafeInteger(Number(id)) || Number(expires) <= Date.now() / 1000)
    return null;
  const expected = Buffer.from(sign(`${id}.${expires}`));
  const supplied = Buffer.from(signature);
  if (
    expected.length !== supplied.length ||
    !crypto.timingSafeEqual(expected, supplied)
  )
    return null;
  return Number(id);
}
