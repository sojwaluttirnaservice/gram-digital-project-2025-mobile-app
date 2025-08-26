import "../global.css";


import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

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
        // <ThemeProvider value={colorScheme === 'light' ? DarkTheme : DefaultTheme}>
        <ThemeProvider value={DefaultTheme}>
            <SafeAreaProvider>

                <SafeAreaView
                    style={{ flex: 1, backgroundColor: "white", }}
                    edges={['top', 'left', 'right']} // ignore bottom safe area
                >
                    <Stack>
                        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                        <Stack.Screen name="+not-found" />
                    </Stack>
                    <StatusBar style="inverted" />
                </SafeAreaView>
            </SafeAreaProvider>
        </ThemeProvider>
    );
}
