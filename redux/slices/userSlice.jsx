// store/userSlice.js
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

/**
 * @typedef {Object} UserState
 * @property {string} id - User ID
 * @property {string} username - Username
 * @property {string} name - Full name
 * @property {string} token - Auth token
 * @property {boolean} isAuthenticated - Auth status
 */

/** @type {UserState} */
const initialState = {
    id: '',
    username: '',
    name: '',
    token: '',
    isAuthenticated: false,
};

const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        /**
         * Set user information (login)
         * @param {UserState} state
         * @param {PayloadAction<Omit<UserState, 'isAuthenticated'>>} action
         */
        login: (state, action) => {
            const { id, username, name, token } = action.payload;
            state.id = id;
            state.username = username;
            state.name = name;
            state.token = 'dummyToken' || token;
            state.isAuthenticated = true;
        },

        /**
         * Clear user information (logout)
         * @param {UserState} state
         */
        logout: (state) => {
            state.id = '';
            state.username = '';
            state.name = '';
            state.token = '';
            state.isAuthenticated = false;
        },
    },
});

export const { login, logout } = userSlice.actions;

const userReducer = userSlice.reducer;

export { userReducer };
