import { createSlice } from "@reduxjs/toolkit";

const stressSlice = createSlice({
  name: "stress",
  initialState: {
    cpuStressData: [],
    memoryStressData: [],
  },
  reducers: {
    setCpuStress: (state, action) => {
      state.cpuStressData=action.payload;
    },
    setMemoryStress: (state, action) => {
      state.memoryStressData=action.payload;
    },
  },
});

export const { setCpuStress, setMemoryStress } = stressSlice.actions;
export default stressSlice.reducer;
