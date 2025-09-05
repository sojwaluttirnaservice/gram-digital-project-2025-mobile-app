import "../global.css"

import React from 'react'
// import { useFonts } from 'expo-font';
// import { useColorScheme } from '@/hooks/useColorScheme';


import store from "@/redux/store/store"
import { Stack } from 'expo-router'
import { StatusBar } from "expo-status-bar"
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context"
import { Provider } from "react-redux"


/**
    This Rootlayout is created because to smooth the auth flow
    
    The normal tabs and _layout were moved in protected so i can use redux use selector there and
    also to Redirect to auth page when not logged in, because right now Redirect is not able to load the page
    (but in future it will)

    Reference Video Link: https://www.youtube.com/watch?v=yNaOaR2kIa0
 */
const RootLayout = () => {


    //  const colorScheme = useColorScheme();
    // const [loaded] = useFonts({
    //     SpaceMono: require('../../assets/fonts/SpaceMono-Regular.ttf'),
    // });

    // if (!loaded) {
    //     // Async font loading only occurs in development.
    //     return null;
    // }
    return (


        // Redux store provider
        <Provider store={store}>

            <SafeAreaProvider>
                <SafeAreaView
                    style={{ flex: 1, background: "white" }}
                    edges={['top', 'left', 'right']}
                >
                    {/* Screen Stacking */}
                    <Stack>
                        {/* First Screen */}
                        <Stack.Screen
                            name="(protected)"
                            options={{
                                headerShown: false,
                                animation: 'none'
                            }}
                        />

                        {/* Second Screen */}
                        <Stack.Screen
                            name="auth"
                            options={{
                                headerShown: false,
                                animation: 'none'
                            }}
                        />
                    </Stack>

                    {/* Status Bar */}
                    <StatusBar style="auto" />

                </SafeAreaView>
            </SafeAreaProvider>
        </Provider>

    )
}

export default RootLayout