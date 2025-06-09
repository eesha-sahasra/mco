import { createSlice } from "@reduxjs/toolkit";

const totalCpuUtilSlice=createSlice({
    name:"totalCpuUtil",
    initialState:{
        cpuUtilData:[],
    },
    reducers:{
        setCpuUtilData:(state,action)=>{
            state.cpuUtilData=action.payload;
        },
    },
});

export const {setCpuUtilData}=totalCpuUtilSlice.actions;

export default totalCpuUtilSlice.reducer;