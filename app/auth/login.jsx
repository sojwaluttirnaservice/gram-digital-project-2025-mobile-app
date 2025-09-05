import Label from '@/components/custom/form/Label';
import ScreenWrapper from '@/components/custom/screens/ScreenWrapper';
import { setServerUrl } from '@/redux/slices/connectionSlice';
import { login } from '@/redux/slices/userSlice';
import { setWebsites } from '@/redux/slices/websitesSlice';
import { Feather } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useApi } from '../../hooks/custom/useApi';

const initialState = {
    id: '',
    username: 's',
    password: 's',
};

const LoginScreen = () => {
    const router = useRouter();
    const [inputUser, setInputUser] = useState(initialState);
    const [showPassword, setShowPassword] = useState(false);


    const { serverUrl } = useSelector(state => state.connection)


    const websites = useSelector(state => state.websites)

    const connection = useSelector(state => state.connection)

    const { instance } = useApi()


    const dispatch = useDispatch()




    useEffect(() => {

        const fetchWebsites = async () => {
            try {

                let { success, data } = await instance.get('/websites')

                if (success) {
                    dispatch(setWebsites(data.websites))
                }
            } catch (err) {
                console.error(err)
            }
        }


        fetchWebsites()

    }, [])

    const handleLogin = async () => {


        let { success, data } = await instance.post('/auth/login', inputUser)


        if (success) {
            dispatch(login(data.user))
            router.replace("/(tabs)")
        }

    };

    return (
        <ScreenWrapper >
            <View className="flex-1 justify-center px-6 bg-white">
                {/* Title */}
                <Text className="text-3xl font-bold mb-8 text-gray-800 text-center">
                    Welcome Back
                </Text>

                

                {/* Form */}
                <View className="space-y-8">
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



                    {/* Village Name */}
                    <View>
                        <View className="border border-gray-300 rounded-lg overflow-hidden">

                            {websites?.length > 0 && (
                                <Picker
                                    selectedValue={serverUrl}
                                    onValueChange={(itemValue) => dispatch(setServerUrl(itemValue))}
                                    dropdownIconColor="#374151" // arrow color
                                    style={{ color: "#111827", backgroundColor: "white" }} // text color + bg
                                >
                                    {/* Default placeholder */}
                                    <Picker.Item
                                        key="placeholder"
                                        label="-- Select --"
                                        value=""
                                    />

                                    {/* Local option for testing */}
                                    <Picker.Item
                                        key="local"
                                        label="Local"
                                        value="http://192.168.1.2:5900"
                                    />

                                    {/* Dynamic websites list */}
                                    {websites.map((web, idx) => (
                                        <Picker.Item
                                            key={web.id || idx}
                                            label={web.grampanchayat_name || web.village_name || `Website ${idx + 1}`}
                                            value={web.website_link}
                                        />
                                    ))}
                                </Picker>
                            )}
                        </View>
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
