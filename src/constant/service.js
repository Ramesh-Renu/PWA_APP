export const API = {
  /*** USER Login ***/
  GET_OTP: "/api/otp/send-otp",
  GET_LOGIN: "/api/otp/verify-otp",
  CREATE_USER: "/api/users/register",
  LOGOUT: "/api/logout",
  GET_USER_INFO: "/api/users/profile",
  GET_PHOTO_SYNC: "/master/api/AdManagement/ad-user-photosync",
  
  /** NOTIFICATION */
  GET_RECENT_NOTIFICATION:
    "/master/TicketManagement/getnotification",
};
