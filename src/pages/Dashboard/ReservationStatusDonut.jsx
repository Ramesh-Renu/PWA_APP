import React from "react";
import DonutChart from "./DonutChart";

const ReservationStatusDonut = ({ data, loading }) => {
  const created = data?.todayStatus?.created || 0;
  const cancelled = data?.todayStatus?.cancelled || 0;
  const completed = data?.todayStatus?.completed || 0;
  const total = created + cancelled + completed;

  const donutPayload = {
    allCountries: [
      { countryId: "created", countryName: "Created", countryCount: created },
      { countryId: "cancelled", countryName: "Cancelled", countryCount: cancelled },
      { countryId: "completed", countryName: "Completed", countryCount: completed },
    ],
    overallCountryCount: total,
  };

  return (
    <DonutChart
      title="Reservation status"
      centerLabel="Reservations"
      variant="country"
      data={donutPayload}
      loading={loading}
    />
  );
};

export default ReservationStatusDonut;
