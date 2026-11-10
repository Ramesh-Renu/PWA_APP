const STORAGE_KEY = "table-booking-reminder-settings";
const NOTIFICATION_HISTORY_KEY = "table-booking-notification-history";

export const DEFAULT_REMINDER_SETTINGS = {
  push: true,
  email: true,
  sms: false,
  leadMinutes: 30,
};

export const getReminderSettings = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return { ...DEFAULT_REMINDER_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_REMINDER_SETTINGS };
  }
};

export const saveReminderSettings = (patch = {}) => {
  const next = { ...getReminderSettings(), ...patch };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
};

export const requestBrowserNotificationPermission = async () => {
  if (!("Notification" in window)) {
    return { granted: false, permission: "unsupported" };
  }

  if (Notification.permission === "granted") {
    return { granted: true, permission: "granted" };
  }

  const permission = await Notification.requestPermission();
  return { granted: permission === "granted", permission };
};

export const sendBrowserReminder = ({ title, body, tag = "table-reminder" }) => {
  if (!("Notification" in window)) return false;
  if (Notification.permission !== "granted") return false;

  new Notification(title, { body, tag });
  return true;
};

export const getNotificationHistory = () => {
  try {
    const raw = localStorage.getItem(NOTIFICATION_HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveNotificationHistory = (entry) => {
  if (!entry || !entry.title) return [];

  const next = [
    {
      id: Date.now(),
      createdAt: new Date().toISOString(),
      ...entry,
    },
    ...getNotificationHistory(),
  ].slice(0, 25);

  localStorage.setItem(NOTIFICATION_HISTORY_KEY, JSON.stringify(next));
  return next;
};

export const formatReminderLabel = (minutes = 30) => {
  if (minutes >= 60) {
    const hours = Math.round(minutes / 60);
    return `${hours} hr before`;
  }
  return `${minutes} min before`;
};
