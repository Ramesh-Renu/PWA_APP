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
export const getOTp = (params) =>
  creatAPI.POST(API.GET_OTP, params, undefined, { skipAuth: true });
export const getLogin = (params) =>
  creatAPI.POST(API.GET_LOGIN, params, undefined, { skipAuth: true });
export const createUser = (params) =>
  creatAPI.POST(API.CREATE_USER, params, undefined, { skipAuth: true });
export const logout = (params) => creatAPI.POST(API.LOGOUT, params);
export const getUserInfo = (params) => baseAPI.GET(API.GET_USER_INFO, params);
export const getRefreshTocken = (params) =>
  baseAPI.POST(API.GET_REFRESH_TOCKEN, params, undefined, { skipAuth: true });

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
// date (YYYY-MM-DD) + time (HH:mm) return seat availability for that slot.
export const getTablebyid = (params) =>
  baseAPI.GET(
    API.TABLE_API + "/" + params.hotel_id,
    params.date && params.time ? { date: params.date, time: params.time } : undefined,
  );
export const deleteTable = (params) => baseAPI.DELETE(API.DELETE_TABLE_API +"/"+params.table_id);

/** Floor **/
export const createFloor = (params) =>
  baseAPI.POST(`${API.FLOOR_API}/${params.hotel_id}`, params);
export const getAllFloor = (params) => baseAPI.GET(API.FLOOR_API+"/"+params.hotel_id);
export const deleteFloor = (params) => baseAPI.DELETE(API.DELETE_FLOOR_API +"/"+params.floor_id);

/** Seat **/
export const addSeatInTable = (body, tableId) => baseAPI.POST(`${API.SEAT_API}/${tableId}/add`, body);
export const getAllSeatInTable = (params) =>
  baseAPI.GET(`${API.SEAT_API}/${params.table_id}`);
export const deleteSeatInTable = (body, tableId) => baseAPI.DELETE(`${API.DELETE_SEAT_API}/${tableId}/remove`, body);

/** Reservation **/
export const createReservation = (params) => baseAPI.POST(API.RESERVATION_API, params);
export const updateReservation = (reservationId, body) => baseAPI.PUT(`${API.RESERVATION_API}/${reservationId}`, body);
export const updateDiningStatus = (reservationId, body) =>baseAPI.PATCH(`${API.RESERVATION_API}/${reservationId}/dining-status`, body);
export const getReservationByHotel = (params) => baseAPI.GET(API.GET_RESERVATION_HOTEL+"/"+params.hotel_id);
export const getReservationByUser = (params) =>
  baseAPI.GET(API.GET_RESERVATION_USER, params);
export const getDashboardSummary = (params) => baseAPI.POST(API.DASHBOARD_SUMMARY, params);
export const deleteReservation = (params) => baseAPI.DELETE(API.RESERVATION_API+"/"+params.reservation_id+"/cancel");

/** Orders  **/
// With reservation_id the order goes on that table booking; without it the
// order is placed with no booking.
export const createOrder = (params) =>
  params.reservation_id
    ? baseAPI.POST(`${API.ORDERS_API}/reservation/${params.reservation_id}`, params)
    : baseAPI.POST(API.ORDERS_API, params);
export const getAllOrders = (params) => baseAPI.GET(`${API.ORDERS_API}`, params);
export const updateOrderStatus = (orderId, body) => baseAPI.PATCH(`${API.ORDERS_API}/${orderId}/status`, body);
export const cancelOrder = (orderId) => baseAPI.PATCH(`${API.ORDERS_API}/${orderId}/cancel`);

/** Cooks (assigned to orders when accepted) **/
export const getCooks = (params) => baseAPI.GET(API.COOK_API, params);
export const createCook = (body) => baseAPI.POST(API.COOK_API, body);
export const updateCook = (cookId, body) => baseAPI.PUT(`${API.COOK_API}/${cookId}`, body);
export const deleteCook = (cookId) => baseAPI.DELETE(`${API.COOK_API}/${cookId}`);

/** Servers (assigned to orders when served) **/
export const getServers = (params) => baseAPI.GET(API.SERVER_API, params);
export const createServer = (body) => baseAPI.POST(API.SERVER_API, body);
export const updateServer = (serverId, body) => baseAPI.PUT(`${API.SERVER_API}/${serverId}`, body);
export const deleteServer = (serverId) => baseAPI.DELETE(`${API.SERVER_API}/${serverId}`);

/** Cleaners (assigned when a table goes to Cleaning) **/
export const getCleaners = (params) => baseAPI.GET(API.CLEANER_API, params);
export const createCleaner = (body) => baseAPI.POST(API.CLEANER_API, body);
export const updateCleaner = (cleanerId, body) => baseAPI.PUT(`${API.CLEANER_API}/${cleanerId}`, body);
export const deleteCleaner = (cleanerId) => baseAPI.DELETE(`${API.CLEANER_API}/${cleanerId}`);

/** Replace an order's items: [{ menu_id, quantity }] (admin) **/
export const updateOrderItems = (orderId, items) =>
  baseAPI.PUT(`${API.ORDERS_API}/${orderId}/items`, { items });

// payment_method: "cash" | "card" | "upi" (with payment_status 1 = Paid).
export const updateOrderPayment = (orderId, body) =>
  baseAPI.PATCH(`${API.ORDERS_API}/${orderId}/payment`, body);

// item_status: 1 = Ordered, 3 = Ready (prepared).
export const updateOrderItemStatus = (orderId, itemId, itemStatus) =>
  baseAPI.PATCH(`${API.ORDERS_API}/${orderId}/items/${itemId}/status`, {
    item_status: itemStatus,
  });


/** Masters */
export const createArea = (params) => baseAPI.POST(API.CREATE_AREA_API, params);
export const getAllArea = (params) => baseAPI.GET(API.GETALL_AREA_API, params);
export const updateArea = (areaId, body) =>
  baseAPI.PUT(`${API.CREATE_AREA_API}/${areaId}`, body);
export const deleteArea = (areaId) => baseAPI.DELETE(`${API.CREATE_AREA_API}/${areaId}`);
export const createLocation = (params) => baseAPI.POST(API.CREATE_LOCATION_API, params);
export const getAllLocation = (params) => baseAPI.GET(API.GETALL_LOCATION_API, params);
export const getDiningStatus = (params) => baseAPI.GET(API.GETALL_DINING_STATUS_API, params);
export const getSeatsStatusMatsers = (params) => baseAPI.GET(API.GETALL_SEATS_STATUS_MASTER, params);
export const getOrderStatuses = (params) => baseAPI.GET(API.GETALL_ORDER_STATUS_API, params);

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

/** Menu Side Dishes */
export const getAllSideDishes = (params) =>
  baseAPI.GET(API.SIDE_DISH_API, params);

export const createSideDish = (body) =>
  baseAPI.POST(API.SIDE_DISH_API, body);

export const updateSideDish = (id, body) =>
  baseAPI.PUT(`${API.SIDE_DISH_API}/${id}`, body);

export const deleteSideDish = (id) =>
  baseAPI.DELETE(`${API.SIDE_DISH_API}/${id}`);
/** Menu Categories master */
export const getAllMenuCategories = (params) =>
  baseAPI.GET(API.MENU_CATEGORY_API, params);

export const createMenuCategory = (body) =>
  baseAPI.POST(API.MENU_CATEGORY_API, body);

export const updateMenuCategory = (categoryId, body) =>
  baseAPI.PUT(`${API.MENU_CATEGORY_API}/${categoryId}`, body);

export const deleteMenuCategory = (categoryId) =>
  baseAPI.DELETE(`${API.MENU_CATEGORY_API}/${categoryId}`);

/** Side dishes per menu category */
export const getCategorySideDishes = (params) =>
  baseAPI.GET(API.CATEGORY_SIDE_DISH_API, params);

export const createCategorySideDish = (body) =>
  baseAPI.POST(API.CATEGORY_SIDE_DISH_API, body);

export const updateCategorySideDish = (id, body) =>
  baseAPI.PUT(`${API.CATEGORY_SIDE_DISH_API}/${id}`, body);

export const deleteCategorySideDish = (id) =>
  baseAPI.DELETE(`${API.CATEGORY_SIDE_DISH_API}/${id}`);

/** Installed app (PWA) */
export const reportPwaInstall = (body) => baseAPI.POST(API.PWA_INSTALL_API, body);

export const getPwaInstallSummary = () =>
  baseAPI.GET(`${API.PWA_INSTALL_API}/summary`);

/** Settings masters (admin) */
export const updateLocation = (id, body) =>
  baseAPI.PUT(`${API.GETALL_LOCATION_API}/${id}`, body);
export const deleteLocation = (id) => baseAPI.DELETE(`${API.GETALL_LOCATION_API}/${id}`);

export const getPaymentStatuses = (params) => baseAPI.GET(API.PAYMENT_STATUS_API, params);

// Status masters: only the display name and colour can change.
export const updateDiningStatusMaster = (id, body) =>
  baseAPI.PUT(`${API.GETALL_DINING_STATUS_API}/${id}`, body);
export const updateOrderStatusMaster = (id, body) =>
  baseAPI.PUT(`${API.GETALL_ORDER_STATUS_API}/${id}`, body);
export const updatePaymentStatusMaster = (id, body) =>
  baseAPI.PUT(`${API.PAYMENT_STATUS_API}/${id}`, body);
export const updateSeatStatusMaster = (id, body) =>
  baseAPI.PUT(`${API.GETALL_SEATS_STATUS_MASTER}/${id}`, body);

export const createSpiceLevel = (body) => baseAPI.POST(API.SPICE_LEVEL_API, body);
export const updateSpiceLevel = (id, body) =>
  baseAPI.PUT(`${API.SPICE_LEVEL_API}/${id}`, body);
export const deleteSpiceLevel = (id) => baseAPI.DELETE(`${API.SPICE_LEVEL_API}/${id}`);
