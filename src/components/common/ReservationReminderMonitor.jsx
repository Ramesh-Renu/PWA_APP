import { useEffect } from "react";
import dayjs from "dayjs";
import { getReservationByUser } from "services";
import useAuth from "hooks/useAuth";
import {
  getNotificationHistory,
  getReminderSettings,
  saveNotificationHistory,
  sendBrowserReminder,
} from "utils/reminders";
import { onReservationsChanged } from "utils/orderEvents";

const ReservationReminderMonitor = () => {
  const [{ data: auth }] = useAuth();
  const userId = auth?.details?.id;

  useEffect(() => {
    if (!userId) return undefined;

    let timeoutId;
    let stopped = false;
    let requestId = 0;

    const scheduleNextReminder = async () => {
      const currentRequestId = ++requestId;
      window.clearTimeout(timeoutId);
      const settings = getReminderSettings();
      if (!settings.push || !Number(settings.leadMinutes)) return;

      try {
        const response = await getReservationByUser({ user_id: userId });
        if (stopped || currentRequestId !== requestId) return;

        const bookings = (Array.isArray(response?.data) ? response.data : [])
          .filter((booking) => {
            const bookingTime = new Date(booking.dining_date).getTime();
            return (
              ![3, 4].includes(Number(booking.dining_status)) &&
              Number.isFinite(bookingTime) &&
              bookingTime > Date.now()
            );
          })
          .sort((a, b) => new Date(a.dining_date) - new Date(b.dining_date));

        const deliveredKeys = new Set(
          getNotificationHistory().map((notification) => notification.key),
        );
        const booking = bookings.find((item) => {
          const key = `reservation:${item.id || `${item.hotel_id}:${item.dining_date}`}`;
          return !deliveredKeys.has(key);
        });
        if (!booking) return;

        const key = `reservation:${booking.id || `${booking.hotel_id}:${booking.dining_date}`}`;
        const title = "Reservation reminder";
        const body = `${booking.hotel_name || "Your restaurant"} booking starts ${dayjs(booking.dining_date).format("ddd, D MMM, h:mm A")}.`;
        const deliver = () => {
          if (stopped) return;
          if (getNotificationHistory().some((notification) => notification.key === key)) {
            void scheduleNextReminder();
            return;
          }
          saveNotificationHistory({ key, title, message: body, variant: "success" });
          if ("Notification" in window && Notification.permission === "granted") {
            sendBrowserReminder({ title, body, tag: key });
          }
          void scheduleNextReminder();
        };

        const triggerTime = new Date(booking.dining_date).getTime() - Number(settings.leadMinutes) * 60 * 1000;
        const delay = triggerTime - Date.now();
        if (delay <= 0) {
          deliver();
        } else {
          timeoutId = window.setTimeout(deliver, delay);
        }
      } catch (error) {
        console.error("Reservation reminder scheduling failed", error);
      }
    };

    const refresh = () => void scheduleNextReminder();
    const unsubscribe = onReservationsChanged(refresh);
    window.addEventListener("table-booking-reminder-settings-updated", refresh);
    window.addEventListener("focus", refresh);
    void scheduleNextReminder();

    return () => {
      stopped = true;
      window.clearTimeout(timeoutId);
      unsubscribe();
      window.removeEventListener("table-booking-reminder-settings-updated", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [userId]);

  return null;
};

export default ReservationReminderMonitor;
