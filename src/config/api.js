// Primary: 127.0.0.1:5000 (works seamlessly when 'adb reverse tcp:5000 tcp:5000' is active)
// LAN Fallback: 10.255.227.1:5000 (works directly across local Wi-Fi)
export const API_BASE_URL = 'http://127.0.0.1:5000';
export const LAN_API_BASE_URL = 'http://10.255.227.1:5000';

export async function fetchWithFallback(endpoint, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);
  
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (res.ok) return res;
  } catch (err) {
    clearTimeout(timeoutId);
    // Try LAN Wi-Fi URL if adb reverse failed
    try {
      const lanController = new AbortController();
      const lanTimeoutId = setTimeout(() => lanController.abort(), 3500);
      const lanRes = await fetch(`${LAN_API_BASE_URL}${endpoint}`, {
        ...options,
        signal: lanController.signal
      });
      clearTimeout(lanTimeoutId);
      if (lanRes.ok) return lanRes;
    } catch (lanErr) {
      throw err;
    }
  }
  throw new Error('All endpoints unreachable');
}
