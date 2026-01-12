export const masterDataState = {
  areaList: { data: [], loading: false, error: null },
  floorList: { data: [], loading: false, error: null },
  locationList: { data: [], loading: false, error: null },
  diningStatusList: { data: [], loading: false, error: null },
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


