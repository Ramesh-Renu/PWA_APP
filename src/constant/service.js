export const API = {
  /*** USER Login ***/
  GET_OTP: "/api/otp/send-otp",
  GET_LOGIN: "/api/otp/verify-otp",
  CREATE_USER: "/api/users/register",
  LOGOUT: "/api/logout",
  GET_USER_INFO: "/api/users/profile",
  GET_REFRESH_TOCKEN: "/api/auth/refresh",
  HOTEL_API: "/api/hotel",
  TABLE_API: "/api/tables/hotel",
  DELETE_TABLE_API: "/api/tables",
  FLOOR_API: "/api/floors/hotel",
  DELETE_FLOOR_API: "/api/floors",
  SEAT_API: "/api/seats/table",
  DELETE_SEAT_API: "/api/seats",
  RESERVATION_API: "/api/reservations",

  /** NOTIFICATION */
  GET_RECENT_NOTIFICATION: "/master/TicketManagement/getnotification",
};
