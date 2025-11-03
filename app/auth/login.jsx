import Input from '@/components/custom/form/Input';
import ScreenWrapper from '@/components/custom/screens/ScreenWrapper';
import { app } from '@/data/app';
import { setServerUrl } from '@/redux/slices/connectionSlice';
import { setGp } from '@/redux/slices/gpSlice';
import { login } from '@/redux/slices/userSlice';
import { setWebsites } from '@/redux/slices/websitesSlice';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useApi } from '../../hooks/custom/useApi';

const initialState = {
    id: '',
    username: 's',
    password: 's',
};

const LoginScreen = () => {
    const { instance } = useApi()

    const router = useRouter();
    const [inputUser, setInputUser] = useState(initialState);
    const [showPassword, setShowPassword] = useState(false);


    const { serverUrl, isDev } = useSelector(state => state.connection)


    const websites = useSelector(state => state.websites)

    const [location, setLocation] = useState(null);



    const dispatch = useDispatch()


    // FOR LOCATION ACCESS
    useEffect(() => {

        const getCurrentLocation = async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert(
                    "Location Required",
                    "You must enable location access to use this app."
                );
                getCurrentLocation()
                return;
            }


            let location = await Location.getCurrentPositionAsync({})
            setLocation(location)
        }

        getCurrentLocation()

    }, [])


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
    useEffect(() => {
        fetchWebsites()
    }, [])

    const handleLogin = async () => {
        try {
            let { success, data } = await instance.post('/auth/login', inputUser)

            if (success) {
                dispatch(login(data.user))
                router.replace("/(tabs)")
            }
        } catch (err) {
            console.log(err)
        }

    };

    return (
        <ScreenWrapper >
            <View className="flex-1 justify-center px-6 bg-white">
                {/* Title */}
                <Text className="text-3xl font-bold mb-8 text-gray-800 text-center">
                    Welcome To {app.name}
                </Text>



                {/* Form */}
                <View className="flex-col gap-4">
                    {/* Username */}
                    <View>
                        <Input
                            label='Username'
                            value={inputUser.username}
                            isLabelFloating
                            onChangeText={(text) => setInputUser({ ...inputUser, username: text })}
                        />
                    </View>

                    {/* Password */}
                    <View>
                        <Input
                            label='Password'
                            value={inputUser.password}
                            isLabelFloating
                            secureTextEntry={!showPassword}
                            onChangeText={(text) => setInputUser({ ...inputUser, username: text })}
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
                                    onValueChange={(itemValue, itemIndex) => {
                                        let selectIndex = isDev ? itemIndex - 2 : itemIndex - 1
                                        dispatch(setGp({
                                            grampanchayat_name: websites[selectIndex].grampanchayat_name
                                        }))
                                        dispatch(setServerUrl(itemValue))
                                    }
                                    }
                                    dropdownIconColor="#374151" // arrow color
                                    style={{ color: "#111827", backgroundColor: "white" }} // text color + bg
                                >
                                    {/* Default placeholder */}
                                    <Picker.Item
                                        key="placeholder"
                                        label="--Select--"
                                        value=""
                                    />

                                    {
                                        isDev &&
                                        <Picker.Item
                                            key="local"
                                            label="Local"
                                            value="http://192.168.1.2:5900"
                                        />
                                    }

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


                        <View className='mt-2 flex items-end'>
                            <Pressable
                                onPress={fetchWebsites}
                                className="bg-indigo-500 px-4 py-2 rounded-md active:opacity-80 flex-row items-center self-start"
                            >
                                <MaterialIcons name="refresh" size={20} color="white" />
                                <Text className="text-white text-base font-medium ml-2">
                                    Refresh Site List
                                </Text>
                            </Pressable>
                        </View>
                    </View>

                    {/* Button */}

                    <View className='mt-4'>
                        <Pressable
                            onPress={handleLogin}
                            className="w-full bg-indigo-500 rounded-xl py-4 items-center shadow-md active:opacity-80"
                        >
                            <Text className="text-white font-semibold text-lg">Login</Text>
                        </Pressable>

                        {/* <Button variant='solid' size='sm' className='bg-red-500 px-4 py-2'>
                            Login
                        </Button> */}
                    </View>
                </View>
            </View>
        </ScreenWrapper>
    );
};

export default LoginScreen;
