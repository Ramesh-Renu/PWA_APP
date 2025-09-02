export const masterDataState = {
  orderType: { data: [], loading: false, error: null },
  orderCategory: { data: [], loading: false, error: null },
  orderStatus: { data: [], loading: false, error: null },
  packageList: { data: [], loading: false, error: null },
  labelList: { data: [], loading: false, error: null },
  roleList: { data: [], loading: false, error: null },
  suggestedMembersList: { data: [], loading: false, error: null },
  countryList: { data: [], loading: false, error: null },
  marketRegionList: { data: [], loading: false, error: null },
  regionList: { data: [], loading: false, error: null },
  currencyList: { data: [], loading: false, error: null },
  toolsList: { data: [], loading: false, error: null },
  colorList: { data: [], loading: false, error: null },
  languageList: { data: [], loading: false, error: null },
  fontFamilyList: { data: [], loading: false, error: null },
  industriesList: { data: [], loading: false, error: null },
  plgPackgeList: { data: [], loading: false, error: null },
  designationList: { data: [], loading: false, error: null },
  allTeamList: { data: [], loading: false, error: null },
  adUsersList: { data: [], loading: false, error: null },
  allWorkspaceList: { data: [], loading: false, error: null },
  boardList: { data: [], loading: false, error: null },
  packageDetails: { data: [], loading: false, error: null },
};

export const masterDataReducer = (state, action) => {
  const key = action?.payload?.key;

  switch (action?.type) {
    case "LOADING":
      return {
        ...state,
        [key]: {
          ...state[key],
          loading: true,
          error: null,
        },
      };

    case "SUCCESS":
      return {
        ...state,
        [key]: {
          data: action.payload.data,
          loading: false,
          error: null,
        },
      };

    case "ERROR":
      return {
        ...state,
        [key]: {
          data: [],
          loading: false,
          error: action.payload.error,
        },
      };

    default:
      return state;
  }
};


