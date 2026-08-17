import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
    USER: "@gdp_user_state",
    SERVER_URL: "@gdp_server_url",
    GP_INFO: "@gdp_gp_info",
};

export const saveUserState = async (userState) => {
    try {
        if (userState && userState.isAuthenticated) {
            await AsyncStorage.setItem(KEYS.USER, JSON.stringify(userState));
        } else {
            await AsyncStorage.removeItem(KEYS.USER);
        }
    } catch (e) {
        console.error("Error saving user state", e);
    }
};

export const getUserState = async () => {
    try {
        const json = await AsyncStorage.getItem(KEYS.USER);
        return json ? JSON.parse(json) : null;
    } catch (e) {
        console.error("Error getting user state", e);
        return null;
    }
};

export const saveServerUrl = async (url) => {
    try {
        if (url) {
            await AsyncStorage.setItem(KEYS.SERVER_URL, url);
        } else {
            await AsyncStorage.removeItem(KEYS.SERVER_URL);
        }
    } catch (e) {
        console.error("Error saving server url", e);
    }
};

export const getServerUrl = async () => {
    try {
        return await AsyncStorage.getItem(KEYS.SERVER_URL);
    } catch (e) {
        console.error("Error getting server url", e);
        return null;
    }
};

export const saveGpInfo = async (gpInfo) => {
    try {
        if (gpInfo) {
            await AsyncStorage.setItem(KEYS.GP_INFO, JSON.stringify(gpInfo));
        } else {
            await AsyncStorage.removeItem(KEYS.GP_INFO);
        }
    } catch (e) {
        console.error("Error saving gp info", e);
    }
};

export const getGpInfo = async () => {
    try {
        const json = await AsyncStorage.getItem(KEYS.GP_INFO);
        return json ? JSON.parse(json) : null;
    } catch (e) {
        console.error("Error getting gp info", e);
        return null;
    }
};
