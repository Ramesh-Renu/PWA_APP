/** Check local auth exist */
// export const issetAuthToken = async() => {
//   return (localStorage.getItem('accessToken'))? true : false;
// }

/** Check local workspace exist */
export const issetActiveWorkSpace = async() => {
  return (localStorage.getItem('workspaceId'))? true : false;
}

/** Check local authtype exist */
export const issetAuthType = async() => {
  return (localStorage.getItem('authType'))? true : false;
}

/** Set data */
// export const setAuthToken  = async(data) =>{
//   if(data){
//     localStorage.setItem('accessToken', data);
//   }else{
//     localStorage.removeItem('accessToken');
//   }
//   return true;
// }

/** Set expiresOn */
export const setExpiresOn  = async(data) =>{
  if(data){
    localStorage.setItem('expiresOn', data);
  }else{
    localStorage.removeItem('expiresOn');
  }
  return true;
}

/** Get expiresOn */
export const getExpiresOn = () => {
  const expiresOn = localStorage.getItem('expiresOn');
  if (expiresOn) {
    return Number(expiresOn);
  }
  return null; // Or handle this case appropriately
};

/** Get data */
// export function getAuthToken(){
//   if (issetAuthToken) {
//       const storageData = localStorage.getItem('accessToken');
//       return storageData;
//   } else {
//       console.log('Cannot get from storage: Session storage no set!');
//       return '';
//   }
// }

/** Set auth type */
export const setAuthType  = async(data) =>{
  if(data){
    localStorage.setItem('authType', data);
  }else{
    localStorage.removeItem('authType');
  }
  return true;
}

/** Get auth type */
export const getAuthType = () => {
  const authType = localStorage.getItem('authType');
  if (authType) {
    return authType;
  }
  return null; // Or handle this case appropriately
};

/** Set DeepLink URL */
export const setDeepLinkURL  = async(data) =>{
  if(data){
    localStorage.setItem('deepLinkURL', data);
  }else{
    localStorage.removeItem('deepLinkURL');
  }
  return true;
}

/** Get DeepLink URL */
export const getDeepLinkURL = () => {
  const deepLinkURL = localStorage.getItem('deepLinkURL');
  if (deepLinkURL) {
    return deepLinkURL;
  }
  return null; // Or handle this case appropriately
};

/** Set active workspace */
export const setActiveWorkSpace  = async(data) =>{
  if(data){
    localStorage.setItem('workspaceId', data);
  }else{
    localStorage.removeItem('workspaceId');
  }
  return true;
}

/** Get active workspace info */
export function getActiveWorkSpace(){
  if (issetActiveWorkSpace) {
      const storageData = localStorage.getItem('workspaceId');
      return storageData;
  } else {
      console.log('Cannot get from storage: Session storage no set!');
      return '';
  }
}


/** Flush the session after logout */
export const flushAuthToken = async() => {
  // localStorage.removeItem('accessToken');
  localStorage.removeItem('expiresOn');
  localStorage.removeItem('authType');
  localStorage.removeItem('workspaceId');
  return false;
}
