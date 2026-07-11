import React from "react";
import DonutChart from "./DonutChart";

const ReservationStatusDonut = ({ data, loading }) => {
  const created = data?.todayStatus?.created || 0;
  const cancelled = data?.todayStatus?.cancelled || 0;
  const completed = data?.todayStatus?.completed || 0;
  const seated = data?.todayStatus?.seated || 0;
  const pending = data?.todayStatus?.pending || 0;  
  const total = created + cancelled + completed + seated + pending;
  const donutPayload = {
    all: [
      { statusId: "created", statusName: "Created", statusCount: created },
      { statusId: "cancelled", statusName: "Cancelled", statusCount: cancelled },
      { statusId: "completed", statusName: "Completed", statusCount: completed },
      { statusId: "seated", statusName: "Seated", statusCount: seated },
      { statusId: "pending", statusName: "Pending", statusCount: pending },
    ],
    overallStatusCount: total,
  };

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
