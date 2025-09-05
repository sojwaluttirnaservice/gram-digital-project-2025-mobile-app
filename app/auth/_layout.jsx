import { Stack } from "expo-router";
import React from "react";

const AuthLayout = () => {

    return <Stack screenOptions={{ headerShown: false }} />

    // return <Stack/>


    // return (
    //     <Stack screenOptions={{ headerShown: false }}>
    //         <Stack.Screen name="index" options={{ headerShown: false }} />
    //         {/* <Stack.Screen name="login" options={{ headerShown: false }} /> */}
    //     </Stack>

    //     //  <Stack screenOptions={{ headerShown: false }} />
    // );
}

export default AuthLayout 
