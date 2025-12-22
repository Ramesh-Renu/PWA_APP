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
export const getRefreshTocken = (params) => baseAPI.GET(API.GET_REFRESH_TOCKEN, params);
export const getPhotoSync = (params) => baseAPI.PUT(API.GET_PHOTO_SYNC, params);

/** NOTIFICATION */
export const getRecentNotification = (params) => baseAPI.POST(API.GET_RECENT_NOTIFICATION, params);

