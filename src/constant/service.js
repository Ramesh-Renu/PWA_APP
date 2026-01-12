export const API = {
  /*** USER Login ***/
  GET_OTP: "/api/otp/send-otp",
  GET_LOGIN: "/api/otp/verify-otp",
  CREATE_USER: "/api/users/register",
  GET_REFRESH_TOCKEN: "/api/auth/refresh",
  LOGOUT: "/api/logout",
  GET_USER_INFO: "/api/users/profile",
  HOTEL_API: "/api/hotel",
  TABLE_API: "/api/tables/hotel",
  DELETE_TABLE_API: "/api/tables",
  FLOOR_API: "/api/floors/hotel",
  DELETE_FLOOR_API: "/api/floors",
  SEAT_API: "/api/seats/table",
  DELETE_SEAT_API: "/api/seats/table",
  RESERVATION_API: "/api/reservations",
  GET_RESERVATION_HOTEL: "/api/reservations/hotel",
  GET_RESERVATION_USER: "/api/reservations/user",
  CREATE_AREA_API: "/api/areas",
  GETALL_AREA_API: "/api/areas",
  CREATE_LOCATION_API: "/api/locations",
  GETALL_LOCATION_API: "/api/locations",
  CREATE_DINING_STATUS_API: "/api/dining-status",
  GETALL_DINING_STATUS_API: "/api/dining-status",
  

  /** NOTIFICATION */
  GET_RECENT_NOTIFICATION: "/master/TicketManagement/getnotification",
};
