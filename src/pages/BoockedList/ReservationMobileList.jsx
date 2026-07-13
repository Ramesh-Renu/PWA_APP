import ReservationCard from "./ReservationCard";

const ReservationMobileList = ({
  reservations,
  onEdit,
}) => {
  return (
    <div className="reservation-mobile">

      {reservations.map((item) => (
        <ReservationCard
          key={item.id}
          reservation={item}
          onEdit={onEdit}
        />
      ))}

    </div>
  );
};

export default ReservationMobileList;