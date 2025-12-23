import baseAPI from "./baseAPI";
import { API } from "constant/service";
import creatAPI from "./creatAPI";

/**
 *
 * @param {Record<string, any>} params
 * @returns {Promise<{
 *  data: {Record<string, any>}
 * }>}
 */
export const getOTp = (params) => creatAPI.POST(API.GET_OTP, params);
export const getLogin = (params) => creatAPI.POST(API.GET_LOGIN, params);
export const createUser = (params) => creatAPI.POST(API.CREATE_USER, params);
export const logout = (params) => creatAPI.POST(API.LOGOUT, params);
export const getUserInfo = (params) => baseAPI.GET(API.GET_USER_INFO, params);
export const getRefreshTocken = (params) => baseAPI.POST(API.GET_REFRESH_TOCKEN, params);
export const getPhotoSync = (params) => baseAPI.PUT(API.GET_PHOTO_SYNC, params);

/** Hotel **/
export const createHotelAPi = (params) => baseAPI.POST(API.HOTEL_API, params);
export const getAllHotel = (params) => baseAPI.GET(API.HOTEL_API, params);
export const getHotelbyid = (params) => baseAPI.GET(API.HOTEL_API, +"/"+params.hotel_id);
export const searchHotelbyNameLocation = (search) => baseAPI.GET(API.HOTEL_API, { search });
export const updateHotelbyid = (body, hotelId) => baseAPI.PUT(`${API.HOTEL_API}/${hotelId}`, body);
export const deleteHotel = (params) => baseAPI.DELETE(API.HOTEL_API, +"/"+params.hotel_id);

/** Table **/
export const createTable = (params) => baseAPI.POST(API.TABLE_API, params);
export const getAllTable = (params) => baseAPI.GET(API.TABLE_API, params);
export const getTablebyid = (params) => baseAPI.GET(API.TABLE_API, +"/"+params.id);
export const deleteTable = (params) => baseAPI.DELETE(API.DELETE_TABLE_API, +"/"+params.table_id);

/** Floor **/
export const createFloor = (params) => baseAPI.POST(API.FLOOR_API, +"/"+params.hotel_id, params);
export const getAllFloor = (params) => baseAPI.GET(API.FLOOR_API, +"/"+params.hotel_id);
export const deleteFloor = (params) => baseAPI.DELETE(API.DELETE_FLOOR_API, +"/"+params.floor_id);

/** Seat **/
export const createSeat = (params) => baseAPI.POST(API.SEAT_API, params);
export const getAllSeat = (params) => baseAPI.GET(API.SEAT_API, +"/"+  params.table_id);
export const deleteSeat = (params) => baseAPI.DELETE(API.DELETE_SEAT_API, +"/"+params.seat_id);

/** Reservation **/
export const createReservation = (params) => baseAPI.POST(API.RESERVATION_API, params);
export const getAllReservation = (params) => baseAPI.GET(API.RESERVATION_API, params);
export const deleteReservation = (params) => baseAPI.DELETE(API.RESERVATION_API, +"/"+params.reservation_id);

/** Masters */
export const createArea = (params) => baseAPI.POST(API.CREATE_AREA_API, params);
export const getAllArea = (params) => baseAPI.GET(API.GETALL_AREA_API, params);
export const createLocation = (params) => baseAPI.POST(API.CREATE_LOCATION_API, params);
export const getAllLocation = (params) => baseAPI.GET(API.GETALL_LOCATION_API, params);

/** NOTIFICATION */
export const getRecentNotification = (params) => baseAPI.POST(API.GET_RECENT_NOTIFICATION, params);

