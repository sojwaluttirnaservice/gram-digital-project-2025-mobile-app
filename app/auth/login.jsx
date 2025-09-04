import Label from '@/components/custom/form/Label';
import ScreenWrapper from '@/components/custom/screens/ScreenWrapper';
import { login } from '@/redux/slices/userSlice';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

const initialState = {
    id: '',
    username: '',
    password: '',
};

const LoginScreen = () => {
    const router = useRouter();
    const [inputUser, setInputUser] = useState(initialState);
    const [showPassword, setShowPassword] = useState(false);

    const connection = useSelector(state => state.connection)


    const dispatch = useDispatch()

    const handleLogin = async () => {


        const res = await fetch(`${connection.mainUrl}/auth/login`, {
            method: 'POST',
            body: JSON.stringify(inputUser),
            headers: {
                'Content-Type': 'application/json'
            }
        })

        let resData = await res.json();

        let { success, data } = resData

        if (success) { 
            dispatch(login(data.user))
            router.replace("/(tabs)")
        }



    };

    return (
        <ScreenWrapper>
            <View className="flex-1 justify-center px-6 bg-white">
                {/* Title */}
                <Text className="text-3xl font-bold mb-8 text-gray-800 text-center">
                    Welcome Back
                </Text>

                {/* Form */}
                <View className="space-y-6">
                    {/* Username */}
                    <View>
                        <Label>Username</Label>
                        <TextInput
                            placeholder="Enter your username"
                            value={inputUser.username}
                            onChangeText={(text) => setInputUser({ ...inputUser, username: text })}
                            className="w-full border border-gray-300 rounded-xl px-4 py-3 mt-2 text-base"
                        />
                    </View>

                    {/* Password */}
                    <View>
                        <Label>Password</Label>
                        <TextInput
                            placeholder="Enter your password"
                            secureTextEntry={!showPassword}
                            value={inputUser.password}
                            onChangeText={(text) => setInputUser({ ...inputUser, password: text })}
                            className="w-full border border-gray-300 rounded-xl px-4 py-3 mt-2 text-base"
                        />
                        <Pressable
                            onPress={() => setShowPassword(!showPassword)}
                            className="mt-2 self-end"
                        >
                            <View className="flex flex-row gap-2">

                                <Feather
                                    name={showPassword ? "eye" : "eye-off"}
                                    size={20}
                                    color="#6b7280"
                                />
                            </View>
                        </Pressable>
                    </View>


                    {/* Button */}

                    <View className='mt-4'>
                        <Pressable
                            onPress={handleLogin}
                            className="w-full bg-blue-600 rounded-xl py-4 items-center shadow-md active:opacity-80"
                        >
                            <Text className="text-white font-semibold text-lg">Login</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </ScreenWrapper>
    );
};

export default LoginScreen;
