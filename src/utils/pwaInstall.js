// Installed-app (PWA) helpers: catch the browser's install offer, know
// whether the app runs installed, and report installed devices so admins
// can see how many users installed it.
import { reportPwaInstall } from "services";

const DEVICE_KEY = "pwa_device_id";
const REPORTED_KEY = "pwa_reported_on";

let deferredPrompt = null; // Chrome / Edge / Android "beforeinstallprompt"
let installedNow = false;
const listeners = new Set();

const notify = () => listeners.forEach((listener) => listener(getInstallState()));

const safeStorage = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Private mode etc.: reporting just repeats next time.
    }
  },
};

export const detectPlatform = () => {
  const ua = navigator.userAgent || "";
  if (/iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1)) {
    return "ios";
  }
  if (/android/i.test(ua)) return "android";
  if (/windows/i.test(ua)) return "windows";
  if (/macintosh|mac os x/i.test(ua)) return "mac";
  if (/linux/i.test(ua)) return "linux";
  return "other";
};

// Running as the installed app (home-screen / desktop app window).
export const isStandalone = () =>
  window.matchMedia?.("(display-mode: standalone)").matches ||
  window.matchMedia?.("(display-mode: window-controls-overlay)").matches ||
  window.navigator.standalone === true;

export const getInstallState = () => ({
  installed: installedNow || isStandalone(),
  // The browser offers a one-click install (Chrome, Edge, Android).
  canPrompt: Boolean(deferredPrompt),
  platform: detectPlatform(),
});

export const subscribeInstall = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const deviceId = () => {
  let id = safeStorage.get(DEVICE_KEY);
  if (!id) {
    id =
      window.crypto?.randomUUID?.() ||
      `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
    safeStorage.set(DEVICE_KEY, id);
  }
  return id;
};

const signedIn = () => {
  const token = safeStorage.get("token");
  return Boolean(token && token !== "null");
};

/**
 * Tell the API this device runs the installed app (at most once a day;
 * `force` right after installing). Needs a signed-in user.
 */
export const reportInstalledDevice = async ({ force = false } = {}) => {
  if (!signedIn() || !(force || getInstallState().installed)) return;
  const today = new Date().toISOString().slice(0, 10);
  if (!force && safeStorage.get(REPORTED_KEY) === today) return;
  try {
    await reportPwaInstall({ device_id: deviceId(), platform: detectPlatform() });
    safeStorage.set(REPORTED_KEY, today);
  } catch {
    // Not critical; tried again next time the app opens.
  }
};

/** Show the browser's install dialog. Resolves to "accepted" / "dismissed". */
export const promptInstall = async () => {
  if (!deferredPrompt) return "unavailable";
  const prompt = deferredPrompt;
  deferredPrompt = null;
  prompt.prompt();
  const { outcome } = await prompt.userChoice;
  notify();
  return outcome;
};

// Registered once, as early as possible (imported from main.jsx): the
// install offer fires soon after load and is lost if nobody listens.
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault(); // we show our own Install button instead
    deferredPrompt = event;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    installedNow = true;
    deferredPrompt = null;
    notify();
    reportInstalledDevice({ force: true });
  });
}
