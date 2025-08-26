import "../global.css";


import { ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";


// 👇 UI Kitten imports
import { MyTheme } from "@/themes";
import * as eva from '@eva-design/eva';
import { ApplicationProvider, IconRegistry } from '@ui-kitten/components';
import { EvaIconsPack } from '@ui-kitten/eva-icons';

export default function RootLayout() {
    // const colorScheme = useColorScheme();
    const [loaded] = useFonts({
        SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    });

    if (!loaded) {
        // Async font loading only occurs in development.
        return null;
    }

    return (
        <ThemeProvider value={MyTheme}>
            <SafeAreaProvider>
                {/* 👇 Add UI Kitten providers */}
                <IconRegistry icons={EvaIconsPack} />
                <ApplicationProvider {...eva} theme={eva.light}>
                    <SafeAreaView
                        style={{ flex: 1, backgroundColor: "#fff", }}
                        edges={['top', 'left', 'right']} // ignore bottom safe area
                    >

                        <Stack>
                            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                            <Stack.Screen name="+not-found" />
                        </Stack>
                        <StatusBar style="inverted" />
                    </SafeAreaView>
                </ApplicationProvider>
            </SafeAreaProvider>
        </ThemeProvider>
    );
}
