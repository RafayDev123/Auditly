import dns from "node:dns/promises";
import net from "node:net";

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata.google.internal",
  "169.254.169.254",
  "0.0.0.0",
]);

function isPrivateIPv4(ip: string) {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some(Number.isNaN)) return false;
  if (parts[0] === 10) return true;
  if (parts[0] === 127) return true;
  if (parts[0] === 0) return true;
  if (parts[0] === 169 && parts[1] === 254) return true;
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  if (parts[0] === 192 && parts[1] === 168) return true;
  return false;
}

function isPrivateIPv6(ip: string) {
  const lower = ip.toLowerCase();
  return lower === "::1" || lower.startsWith("fc") || lower.startsWith("fd") || lower.startsWith("fe80");
}

export async function validatePublicTarget(rawUrl: string) {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { ok: false as const, message: "Enter a valid absolute URL." };
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return { ok: false as const, message: "Only http:// and https:// URLs are allowed." };
  }

  const hostname = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(hostname)) {
    return { ok: false as const, message: "This host is blocked for security reasons." };
  }

  if (net.isIP(hostname)) {
    const blocked = net.isIPv4(hostname) ? isPrivateIPv4(hostname) : isPrivateIPv6(hostname);
    if (blocked) {
      return { ok: false as const, message: "Private or local network addresses are not allowed." };
    }
  } else {
    try {
      const records = await dns.lookup(hostname, { all: true });
      const blocked = records.some((record) =>
        record.family === 4 ? isPrivateIPv4(record.address) : isPrivateIPv6(record.address),
      );
      if (blocked) {
        return { ok: false as const, message: "Resolved address is private and blocked." };
      }
    } catch {
      return { ok: false as const, message: "Unable to resolve target domain." };
    }
  }

  return {
    ok: true as const,
    normalizedUrl: `${parsed.protocol}//${parsed.host}${parsed.pathname === "/" ? "" : parsed.pathname}`,
    domain: parsed.hostname,
  };
}
