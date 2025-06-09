import { createSlice } from "@reduxjs/toolkit";

const dotIndicatorSlice=createSlice({
    name:"dotIndicator",
    initialState:{
        dotIndicatorCPU:[],
        dotIndicatorMemory:[],
    },
    reducers:{
        setCpuDotIndicator:(state,action)=>{
            state.dotIndicatorCPU=action.payload;
        },
        setMemoryDotIndicator:(state,action)=>{
            state.dotIndicatorMemory=action.payload;
        },
    },
});

export const {setCpuDotIndicator,setMemoryDotIndicator}=dotIndicatorSlice.actions;

export default dotIndicatorSlice.reducer;