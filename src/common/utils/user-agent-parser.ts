/**
 * Parse user agent string into a friendly device name
 */
export function parseUserAgent(userAgent: string | null | undefined): string {
  if (!userAgent) return "Unknown Device";

  const ua = userAgent.toLowerCase();

  // Detect OS
  let os = "Unknown";
  if (ua.includes("iphone")) os = "iPhone";
  else if (ua.includes("ipad")) os = "iPad";
  else if (ua.includes("android")) os = "Android";
  else if (ua.includes("mac os") || ua.includes("macintosh")) os = "Mac";
  else if (ua.includes("windows")) os = "Windows";
  else if (ua.includes("linux")) os = "Linux";
  else if (ua.includes("cros")) os = "ChromeOS";

  // Detect browser
  let browser = "";
  if (ua.includes("edg/")) browser = "Edge";
  else if (ua.includes("chrome") && !ua.includes("chromium")) browser = "Chrome";
  else if (ua.includes("safari") && !ua.includes("chrome")) browser = "Safari";
  else if (ua.includes("firefox")) browser = "Firefox";
  else if (ua.includes("opera") || ua.includes("opr/")) browser = "Opera";

  // Mobile app detection
  if (ua.includes("trendapp") || ua.includes("expo")) {
    return `${os} App`;
  }

  if (browser && os !== "Unknown") {
    return `${browser} on ${os}`;
  } else if (os !== "Unknown") {
    return os;
  } else if (browser) {
    return browser;
  }

  return "Unknown Device";
}
