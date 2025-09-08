// store/index.js
import { configureStore } from "@reduxjs/toolkit";
import { connectionReducer } from "../slices/connectionSlice";
import { userReducer } from "../slices/userSlice";
import { websitesReducer } from "../slices/websitesSlice";
import { gpReducer } from "../slices/gpSlice";

const store = configureStore({
    reducer: {
        connection: connectionReducer,
        user: userReducer,
        websites: websitesReducer,
        gp: gpReducer
        // add more slices here if needed
    },
});

export default store;

// Optional: export RootState and AppDispatch for TypeScript usage
// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;