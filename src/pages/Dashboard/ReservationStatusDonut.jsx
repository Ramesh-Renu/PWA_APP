import React, { useMemo } from "react";
import DonutChart from "./DonutChart";

const STATUSES = [
  { statusId: "created", statusName: "Created" },
  { statusId: "cancelled", statusName: "Cancelled" },
  { statusId: "completed", statusName: "Completed" },
  { statusId: "seated", statusName: "Seated" },
  { statusId: "serving", statusName: "Serving" },
  { statusId: "pending", statusName: "Pending" },
];

const ReservationStatusDonut = ({ data, loading }) => {
  const todayStatus = data?.todayStatus;

  const donutPayload = useMemo(() => {
    const all = STATUSES.map((status) => ({
      ...status,
      statusCount: Number(todayStatus?.[status.statusId]) || 0,
    }));
    return {
      all,
      overallStatusCount: all.reduce((sum, row) => sum + row.statusCount, 0),
    };
  }, [todayStatus]);

  return (
    <DonutChart
      title="Reservation status"
      centerLabel="Reservations"
      variant="status"
      data={donutPayload}
      loading={loading}
    />
  );
};

export default ReservationStatusDonut;
