import {createSlice} from "@reduxjs/toolkit";

const totalMemoryUtilSlice = createSlice({
    name:"totalMemoryUtil",
    initialState:{
        memoryUtilData:[],
    },
    reducers:{
        setMemoryUtilData:(state,action)=>{
            state.memoryUtilData=action.payload;
        },
    },
});

export const {setMemoryUtilData}=totalMemoryUtilSlice.actions;

export default totalMemoryUtilSlice.reducer;