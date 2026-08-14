// store/gpSlice.js
import { createSlice } from "@reduxjs/toolkit";

/**
 * @typedef {Object.<string, any>} GPState
 * Flexible GP state: any shape. Replace with a concrete interface later if desired.
 */

/** @type {GPState} */
const initialState = {};

/**
 * Set a nested value on an object using a dot-path (creates intermediate objects).
 * Example: setDeep(obj, 'profile.name', 'Alice')
 *
 * @param {Object} obj - object to modify (mutates in place)
 * @param {string} path - dot-separated path
 * @param {*} value - value to set
 */
function setDeep(obj, path, value) {
    if (!path) return;
    const keys = path.split(".");
    let cur = obj;
    for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        if (cur[k] == null || typeof cur[k] !== "object") cur[k] = {};
        cur = cur[k];
    }
    cur[keys[keys.length - 1]] = value;
}

/**
 * Delete a nested key by dot-path.
 * Example: deleteDeep(obj, 'profile.temp')
 *
 * @param {Object} obj
 * @param {string} path
 */
function deleteDeep(obj, path) {
    if (!path) return;
    const keys = path.split(".");
    let cur = obj;
    for (let i = 0; i < keys.length - 1; i++) {
        cur = cur[keys[i]];
        if (cur == null || typeof cur !== "object") return;
    }
    delete cur[keys[keys.length - 1]];
}

/**
 * Read a nested value by dot-path.
 * Example: getDeep(obj, 'profile.name') -> 'Alice'
 *
 * @param {Object} obj
 * @param {string} path
 * @returns {*}
 */
function getDeep(obj, path) {
    if (!path) return obj;
    return path.split(".").reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

/**
 * gpSlice: flexible slice for evolving app-wide gp structure.
 * Reducers:
 *  - setGp(payload: GPState)         -> replace entire state
 *  - updateGp(payload: Partial<GPState>) -> shallow merge top-level keys
 *  - setField({ path, value })       -> set nested value by dot-path
 *  - removeField({ path })           -> remove nested value by dot-path
 *  - clearGp()                       -> reset to {}
 *  - login(payload)                  -> convenience: state.user = payload; state.isAuthenticated = true
 *  - logout()                        -> convenience: remove state.user; state.isAuthenticated = false
 */
const gpSlice = createSlice({
    name: "gp",
    initialState,
    reducers: {
        /**
         * Replace the entire GP object.
         * Use for hydration or when backend returns the full object.
         * @param {GPState} state
         * @param {{payload: GPState}} action
         */
        setGp: (state, action) => {
            // Return a replacement object (immer allows returning new state)
            return action.payload || {};
        },

        /**
         * Shallow-merge top-level properties into gp state.
         * @param {GPState} state
         * @param {{payload: Partial<GPState>}} action
         */
        updateGp: (state, action) => {
            Object.assign(state, action.payload);
        },

        /**
         * Set nested value by dot-path (creates intermediate objects).
         * Example: dispatch(setField({ path: 'profile.name', value: 'Alice' }))
         *
         * @param {GPState} state
         * @param {{payload: { path: string, value: any }}} action
         */
        setField: (state, action) => {
            const { path, value } = action.payload || {};
            if (!path) return;
            setDeep(state, path, value);
        },

        /**
         * Remove nested field by dot-path.
         * Example: dispatch(removeField({ path: 'profile.temp' }))
         *
         * @param {GPState} state
         * @param {{payload: { path: string }}} action
         */
        removeField: (state, action) => {
            const { path } = action.payload || {};
            if (!path) return;
            deleteDeep(state, path);
        },

        /**
         * Clear gp state (reset to empty object).
         * @returns {GPState}
         */
        clearGp: () => {
            return {};
        },

        /**
         * Convenience login helper — writes the payload to state.user and sets isAuthenticated flag.
         * Kept for compatibility; remove or replace with your auth slice if you prefer separation.
         *
         * @param {GPState} state
         * @param {{payload: any}} action
         */
        login: (state, action) => {
            state.user = action.payload;
            state.isAuthenticated = true;
        },

        /**
         * Convenience logout helper — removes state.user if present and flips isAuthenticated.
         * @param {GPState} state
         */
        logout: (state) => {
            if (state.user) delete state.user;
            state.isAuthenticated = false;
        },
    },
});

// Export actions
export const { setGp, updateGp, setField, removeField, clearGp, login, logout } = gpSlice.actions;

// export reducer
const gpReducer = gpSlice.reducer;
export { gpReducer };

/* ---------------------------
   Optional selector helpers
   ---------------------------
   You can copy these into your selector file or keep here for convenience.
   Example usage:
     const name = selectGpField('profile.name')(store.getState());
*/

/**
 * Get whole gp object from root state.
 * @param {Object} rootState
 * @returns {GPState}
 */
export const selectGp = (rootState) => rootState.gp;

/**
 * Create a selector for a nested path.
 * @param {string} path
 * @returns {(rootState: Object) => any}
 */
export const selectGpField = (path) => (rootState) => getDeep(rootState.gp || {}, path);

/* ---------------------------
   Usage examples (JS)
   ---------------------------

import store from './store'; // your redux store
import { setGp, updateGp, setField, removeField, clearGp } from './store/gpSlice';

// replace entire gp
store.dispatch(setGp({ profile: { name: 'Alice' }, lastSeen: Date.now() }));

// shallow merge
store.dispatch(updateGp({ lastSeen: Date.now() }));

// set nested value
store.dispatch(setField({ path: 'profile.name', value: 'Bob' }));

// remove nested
store.dispatch(removeField({ path: 'profile.temp' }));

// clear
store.dispatch(clearGp());

*/
