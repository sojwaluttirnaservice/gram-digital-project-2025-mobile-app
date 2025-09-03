// store/index.js
import { configureStore } from "@reduxjs/toolkit";
import { connectionReducer } from "../slices/connectionSlice";
import { userReducer } from "../slices/userSlice";

const store = configureStore({
    reducer: {
        connection: connectionReducer,
        user: userReducer
        // add more slices here if needed
    },
});

export default store;

// Optional: export RootState and AppDispatch for TypeScript usage
// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;