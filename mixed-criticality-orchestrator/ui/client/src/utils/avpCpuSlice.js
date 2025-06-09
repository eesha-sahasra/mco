import { createSlice } from "@reduxjs/toolkit";

const avpCpuSlice=createSlice({
    name:'avpCpu',
    initialState:{
        avgAvpCpu:0,
    },
    reducers:{
        setAvpCpu:(state,action)=>{
            state.avgAvpCpu=action.payload;
        },
    },
});

export const {setAvpCpu}=avpCpuSlice.actions;

export default avpCpuSlice.reducer;