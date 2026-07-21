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
export const getHotelbyid = (params) => baseAPI.GET(API.HOTEL_API+"/"+params.hotel_id);
export const searchHotelbyNameLocation = (search) => baseAPI.GET(API.HOTEL_API, { search });
export const updateHotelbyid = (body, hotelId) => baseAPI.PUT(`${API.HOTEL_API}/${hotelId}`, body);
export const deleteHotel = (params) => baseAPI.DELETE(API.HOTEL_API+"/"+params.hotel_id);

/** Table **/
export const createTable = (body, hotelId, floorId) => baseAPI.POST(`${API.TABLE_API}/${hotelId}/${floorId}`, body);
export const getAllTable = (params) => baseAPI.GET(API.TABLE_API, params);
export const getTablebyid = (params) => baseAPI.GET(API.TABLE_API+"/"+params.hotel_id);
export const deleteTable = (params) => baseAPI.DELETE(API.DELETE_TABLE_API +"/"+params.table_id);

/** Floor **/
export const createFloor = (params) => baseAPI.POST(API.FLOOR_API, +"/"+params.hotel_id, params);
export const getAllFloor = (params) => baseAPI.GET(API.FLOOR_API+"/"+params.hotel_id);
export const deleteFloor = (params) => baseAPI.DELETE(API.DELETE_FLOOR_API +"/"+params.floor_id);

/** Seat **/
export const addSeatInTable = (body, tableId) => baseAPI.POST(`${API.SEAT_API}/${tableId}/add`, body);
export const getAllSeatInTable = (params) => baseAPI.GET(API.SEAT_API, +"/"+  params.table_id);
export const deleteSeatInTable = (body, tableId) => baseAPI.DELETE(`${API.DELETE_SEAT_API}/${tableId}/remove`, body);

/** Reservation **/
export const createReservation = (params) => baseAPI.POST(API.RESERVATION_API, params);
export const updateReservation = (reservationId, body) => baseAPI.PUT(`${API.RESERVATION_API}/${reservationId}`, body);
export const updateDiningStatus = (reservationId, body) =>baseAPI.PATCH(`${API.RESERVATION_API}/${reservationId}/dining-status`, body);
export const getReservationByHotel = (params) => baseAPI.GET(API.GET_RESERVATION_HOTEL+"/"+params.hotel_id);
export const getReservationByUser = (params) => baseAPI.GET(API.GET_RESERVATION_USER);
export const getDashboardSummary = (params) => baseAPI.POST(API.DASHBOARD_SUMMARY, params);
export const deleteReservation = (params) => baseAPI.DELETE(API.RESERVATION_API+"/"+params.reservation_id+"/cancel");

/** Masters */
export const createArea = (params) => baseAPI.POST(API.CREATE_AREA_API, params);
export const getAllArea = (params) => baseAPI.GET(API.GETALL_AREA_API, params);
export const createLocation = (params) => baseAPI.POST(API.CREATE_LOCATION_API, params);
export const getAllLocation = (params) => baseAPI.GET(API.GETALL_LOCATION_API, params);
export const getDiningStatus = (params) => baseAPI.GET(API.GETALL_DINING_STATUS_API, params);
export const getSeatsStatusMatsers = (params) => baseAPI.GET(API.GETALL_SEATS_STATUS_MASTER, params);

/** NOTIFICATION */
export const getRecentNotification = (params) => baseAPI.POST(API.GET_RECENT_NOTIFICATION, params);

/** Menu **/
export const createMenu = (body) => baseAPI.POST(API.MENU_API, body);

export const uploadMenuImage = (body) =>
  baseAPI.POST(API.MENU_IMAGE_UPLOAD_API, body);

export const getAllSpiceLevels = (params) =>
  baseAPI.GET(API.SPICE_LEVEL_API, params);

export const getAllMenu = (params) => baseAPI.GET(API.MENU_API, params);

export const getMenuById = (menuId) =>
  baseAPI.GET(`${API.MENU_API}/${menuId}`);

export const updateMenu = (menuId, body) =>
  baseAPI.PUT(`${API.MENU_API}/${menuId}`, body);

export const deleteMenu = (menuId) =>
  baseAPI.DELETE(`${API.MENU_API}/${menuId}`);

/** Menu Categories master */
export const getAllMenuCategories = (params) =>
  baseAPI.GET(API.MENU_CATEGORY_API, params);

export const createMenuCategory = (body) =>
  baseAPI.POST(API.MENU_CATEGORY_API, body);

export const updateMenuCategory = (categoryId, body) =>
  baseAPI.PUT(`${API.MENU_CATEGORY_API}/${categoryId}`, body);

export const deleteMenuCategory = (categoryId) =>
  baseAPI.DELETE(`${API.MENU_CATEGORY_API}/${categoryId}`);
