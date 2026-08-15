import { Redirect, Stack } from "expo-router";
import "react-native-reanimated";
import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import NetInfo from "@react-native-community/netinfo";
import { setIsConnected } from "@/redux/slices/connectionSlice";

import { dbService } from "@/services/db";

const ProtectedLayout = () => {
    const user = useSelector((state) => state.user);
    const dispatch = useDispatch();

    useEffect(() => {
        // Initialize offline database at the root of the protected stack
        dbService.initDb().catch((err) => console.error("Database initialization failed", err));

        const unsubscribe = NetInfo.addEventListener((state) => {
            dispatch(setIsConnected(state.isConnected && state.isInternetReachable !== false));
        });
        return () => unsubscribe();
    }, [dispatch]);

    const isLoggedIn = user && user.isAuthenticated && user.token;

    if (!isLoggedIn) {
        return <Redirect href={"/auth/login"} />;
    }

    return (
        <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
        </Stack>
    );
};

export default ProtectedLayout;
