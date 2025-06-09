import { configureStore } from "@reduxjs/toolkit";
// import cartReducer from "./cartSlice";
import qmPodReducer from "./qmPodSlice";
import avpCpuReducer from "./avpCpuSlice";
import avpMemoryReducer from "./avpMemorySlice";
import totalCpuUtilReducer from "./totalCpuUtilSlice";
import totalMemoryUtilReducer from "./totalMemoryUtilSlice";
import stressSliceReducer from "./stressSlice";
import dotIndicatorSliceReducer from "./dotIndicatorSlice";

const appStore = configureStore({
  //root reducer consisting of all the child reducers
  reducer: {
    //sliceName:sliceReducerName
    qmPod: qmPodReducer,
    avpCpu: avpCpuReducer,
    avpMemory: avpMemoryReducer,
    totalCpuUtil: totalCpuUtilReducer,
    totalMemoryUtil:totalMemoryUtilReducer,
    stress: stressSliceReducer,
    dotIndicator:dotIndicatorSliceReducer,
  },
});

export default appStore;
