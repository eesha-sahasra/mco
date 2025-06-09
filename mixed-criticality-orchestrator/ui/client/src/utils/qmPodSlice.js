import { createSlice } from "@reduxjs/toolkit";

const qmPodSlice=createSlice({
    name:'qmPod',
    initialState:{
        podUsage:[],
    },
    reducers:{
        //reducer fns written here. Based on the action, the reducer fn modifies the data in the slice.
        setPodUsage:(state,action)=>{
            state.podUsage.push(action.payload);
        },
    },
});

//export actions {1,2,3}
export const {setPodUsage}=qmPodSlice.actions;

//export reducer
export default qmPodSlice.reducer;