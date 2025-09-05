import { Redirect, Stack } from 'expo-router';
import 'react-native-reanimated';
import { useSelector } from 'react-redux';


const ProtectedLayout = () => {
    
    const user = useSelector(state => state.user)
    
    const isLoggedIn = user && user.isAuthenticated && user.token;

    if (!isLoggedIn) {
        return <Redirect href={'/auth/login'} />
    }

    return (
        <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
        </Stack>
    );
}


export default ProtectedLayout