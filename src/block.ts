export const isIpBlocked = (ip: string) => {
  if (ip.startsWith("192.168.")) {
    return true;
  }

  const BLOCKED_IPS = Bun.env.BLOCKED_RANGES || "";

  const envBlockedIps = BLOCKED_IPS.split(",").map((ip) => ip.trim());

  if (envBlockedIps.includes(ip)) {
    return true;
  }

  return false;
};
