import "../global.css";


import { ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { MyTheme } from "@/themes";

import store from "@/redux/store/store";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Provider } from 'react-redux';

export default function RootLayout() {
    const colorScheme = useColorScheme();
    const [loaded] = useFonts({
        SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    });

    if (!loaded) {
        // Async font loading only occurs in development.
        return null;
    }

    return (
        <Provider store={store}>
            <ThemeProvider value={MyTheme}>

                <SafeAreaProvider>
                    <SafeAreaView
                        style={{ flex: 1, background: "white" }}

                        edges={['top', 'left', 'right']}
                    >
                        <Stack>
                            <Stack.Screen name="auth" options={{ headerShown: false }} />
                            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                            <Stack.Screen name="+not-found" />
                        </Stack>
                        <StatusBar style="auto" />

                    </SafeAreaView>
                </SafeAreaProvider>
            </ThemeProvider>
        </Provider>
    );
}


// const AuthOrApp = () => {

//     let user = useSelector(state => state.user)


//     let isLoggedIn = user && user.isAuthenticated && user.token

//     console.log(isLoggedIn)


//     return (
//         <Stack>
//             {isLoggedIn ? (
//                 <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
//             ) : (
//                 <Stack.Screen name="auth" options={{ headerShown: false }} />
//             )}
//             <Stack.Screen name="+not-found" />
//         </Stack>
//     )
// }