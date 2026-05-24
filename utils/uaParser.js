/**
 * Highly robust, lightweight User Agent parser
 * Extracts Browser, Operating System (OS), and Device Type from standard request user-agent headers
 * 
 * @param {string} uaString - The raw user agent string from the client request
 * @returns {object} { browser, os, device }
 */
export const parseUserAgent = (uaString) => {
  const ua = uaString || "";
  let browser = "Other";
  let os = "Other";
  let device = "Desktop";

  // 1. Determine Device Type
  if (/mobi|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
    device = "Mobile";
  } else if (/ipad|tablet|playbook|silk/i.test(ua)) {
    device = "Tablet";
  }

  // 2. Determine Browser
  if (/edg/i.test(ua)) {
    browser = "Edge";
  } else if (/opr|opera/i.test(ua)) {
    browser = "Opera";
  } else if (/chrome|crios/i.test(ua)) {
    // Chrome UA strings also contain "Safari", so check Chrome first
    browser = "Chrome";
  } else if (/firefox|fxios/i.test(ua)) {
    browser = "Firefox";
  } else if (/safari/i.test(ua)) {
    browser = "Safari";
  } else if (/trident|msie/i.test(ua)) {
    browser = "IE";
  }

  // 3. Determine Operating System
  if (/windows/i.test(ua)) {
    os = "Windows";
  } else if (/macintosh|mac os x/i.test(ua)) {
    os = "macOS";
  } else if (/iphone|ipad|ipod/i.test(ua)) {
    os = "iOS";
  } else if (/android/i.test(ua)) {
    os = "Android";
  } else if (/linux/i.test(ua)) {
    os = "Linux";
  }

  return { browser, os, device };
};
