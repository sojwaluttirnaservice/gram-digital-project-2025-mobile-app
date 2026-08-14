import { createSlice } from "@reduxjs/toolkit";

/**
 * @typedef {Object} Website
 * @property {number} id - Website ID
 * @property {string} grampanchayat_name - Name of the grampanchayat
 * @property {string} village_name - Name of the village
 * @property {string} website_link - Website URL
 * @property {string} createdAt - ISO date string of creation
 * @property {string} updatedAt - ISO date string of last update
 */

/**
 * @typedef {Website[]} WebsitesState
 */

/** @type {WebsitesState} */
const initialState = [];

const websitesSlice = createSlice({
    name: "websites",
    initialState,
    reducers: {
        /**
         * Set the entire websites list
         * @param {WebsitesState} state
         * @param {import("@reduxjs/toolkit").PayloadAction<Website[]>} action
         * @returns {WebsitesState}
         */
        setWebsites: (state, action) => {
            return action.payload;
        },

        /**
         * Add a single website to the list
         * @param {WebsitesState} state
         * @param {import("@reduxjs/toolkit").PayloadAction<Website>} action
         */
        addWebsite: (state, action) => {
            state.push(action.payload);
        },

        /**
         * Clear all websites
         * @returns {WebsitesState}
         */
        clearWebsites: () => {
            return [];
        },
    },
});

export const {
    setWebsites,
    addWebsite,
    clearWebsites,
} = websitesSlice.actions;

const websitesReducer = websitesSlice.reducer;

export { websitesReducer };
