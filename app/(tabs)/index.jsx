import { Text } from "react-native";

import ParallaxScrollView from "@/components/ParallaxScrollView";

const HomeScreen = () => {
    return (
        <ParallaxScrollView
            headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
        >
            <Text>
                Thisi a hi
            </Text>
        </ParallaxScrollView>
    );
}


export default HomeScreen