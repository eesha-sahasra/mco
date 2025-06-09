import { createSlice } from "@reduxjs/toolkit";

const avpMemorySlice=createSlice({
    name:'avpMemory',
    initialState:{
        avgAvpMemory:0,
    },
    reducers:{
        setAvpMemory:(state,action)=>{
            state.avgAvpMemory=action.payload;
        },
    },
});

export const {setAvpMemory}=avpMemorySlice.actions;

export default avpMemorySlice.reducer;