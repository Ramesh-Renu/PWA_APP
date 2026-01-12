import { useGlobalContext } from "store/context/GlobalProvider";
import {getAllArea, getAllLocation, getDiningStatus} from "services";

const useGlobalMaster = () => {
  const { masterState, dispatch } = useGlobalContext();

  const fetchMasterData = async (key, apiCall) => {
    if (masterState[key]?.loading) return;

    dispatch({ type: "LOADING", payload: { key } });

    try {
      const res = await apiCall();

      // Adjust this line based on actual structure
      dispatch({
        type: "SUCCESS",
        payload: {
          key,
          data: res?.data ?? [],
        },
      });
      return res;
    } catch (error) {
      dispatch({
        type: "ERROR",
        payload: {
          key,
          error: error.message || "Something went wrong",
        },
      });
      throw error; 
    }
  };

  return {
    ...masterState,
    getAllArea: () => fetchMasterData("areaList", () => getAllArea()),
    getAllLocation: () => fetchMasterData("locationList", () => getAllLocation()),
    getDiningStatus: () => fetchMasterData("diningStatusList", () => getDiningStatus()),
  };
};

export default useGlobalMaster;
