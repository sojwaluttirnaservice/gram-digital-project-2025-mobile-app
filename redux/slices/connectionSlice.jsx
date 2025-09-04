// store/connectionSlice.js
import { createSlice } from "@reduxjs/toolkit";

/**
 * @typedef {Object} ConnectionState
 * @property {string} serverUrl - Base server URL for API calls.
 * @property {string} mainUrl - Main application URL.
 * @property {string|null} apiKey - Optional API key or token.
 * @property {boolean} isConnected - Network connection status.
 * @property {number} timeout - Request timeout in milliseconds.
 */

/** @type {ConnectionState} */



const PROJECT_MODE = process.env.EXPO_PUBLIC_PROJECT_ENV


let isDev = PROJECT_MODE !== "PROD"

const initialState = {
    serverUrl: isDev ? "http://192.168.1.2:5900" : null, // default server URL
    mainUrl: isDev ? "http://192.168.1.2:3000" : "https://g-seva.com",   // example main API URL
    apiKey: null,                          // optional API key or token
    isConnected: true,                     // network connection status
    timeout: 10000,                        // default timeout for requests
    isDev: isDev
    // isDev: !isDev
};

const connectionSlice = createSlice({
    name: "connection",
    initialState,
    reducers: {
        /**
         * Set server URL
         * @param {ConnectionState} state
         * @param {PayloadAction<string>} action
         */
        setServerUrl: (state, action) => {
            console.log("settgin========================================================", action.payload)
            state.serverUrl = action.payload;
        },

        /**
         * Set main URL
         * @param {ConnectionState} state
         * @param {PayloadAction<string>} action
         */
        setMainUrl: (state, action) => {
            state.mainUrl = action.payload;
        },

        /**
         * Set API key
         * @param {ConnectionState} state
         * @param {PayloadAction<string|null>} action
         */
        setApiKey: (state, action) => {
            state.apiKey = action.payload;
        },

        /**
         * Set network connection status
         * @param {ConnectionState} state
         * @param {PayloadAction<boolean>} action
         */
        setIsConnected: (state, action) => {
            state.isConnected = action.payload;
        },

        /**
         * Set request timeout
         * @param {ConnectionState} state
         * @param {PayloadAction<number>} action
         */
        setTimeout: (state, action) => {
            state.timeout = action.payload;
        },
    },
});

export const {
    setServerUrl,
    setMainUrl,
    setApiKey,
    setIsConnected,
    setTimeout,
} = connectionSlice.actions;


const connectionReducer = connectionSlice.reducer

export { connectionReducer };

