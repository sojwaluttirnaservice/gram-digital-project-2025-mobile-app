import ScreenWrapper from "@/components/custom/screens/ScreenWrapper";
import { logout } from "@/redux/slices/userSlice";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Feather } from "@expo/vector-icons";

const ProfileTab = () => {
    const router = useRouter();
    const dispatch = useDispatch();
    const user = useSelector((state) => state.user);

    const handleLogout = () => {
        dispatch(logout());
        // Redirect to login screen
        router.replace("/auth/login");
    };

    return (
        <ScreenWrapper>
            <View className="flex-1 justify-between px-6 py-8 bg-gray-100">
                {/* Profile Info Card */}
                <View className="bg-white rounded-2xl shadow-md p-6">
                    <Text className="text-2xl font-bold text-gray-800 mb-4 text-center">My Profile</Text>

                    <View className="space-y-3">
                        <View className="flex-row justify-between border-b border-gray-200 pb-2">
                            <Text className="text-gray-500 font-medium">Username</Text>
                            <Text className="text-gray-800 font-semibold">{user?.username || "-"}</Text>
                        </View>

                        <View className="flex-row justify-between border-b border-gray-200 pb-2">
                            <Text className="text-gray-500 font-medium">User ID</Text>
                            <Text className="text-gray-800 font-semibold">{user?.id || "-"}</Text>
                        </View>
                    </View>
                </View>

                {/* Direct Links Section */}
                <View className="mt-6 space-y-4">
                    <Pressable
                        onPress={() => router.push("/offline-data")}
                        className="bg-white p-4 rounded-xl shadow-sm flex-row items-center border border-gray-200"
                    >
                        <View className="bg-indigo-100 p-3 rounded-full mr-4">
                            <Feather name="database" size={24} color="#4f46e5" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-gray-800 font-bold text-lg">ऑफलाईन डेटा</Text>
                            <Text className="text-gray-500 text-sm">मोबाईलमध्ये डाउनलोड केलेले सर्व धारक पहा</Text>
                        </View>
                        <Feather name="chevron-right" size={24} color="#9ca3af" />
                    </Pressable>

                    <Pressable
                        onPress={() => router.push("/queue")}
                        className="bg-white p-4 rounded-xl shadow-sm flex-row items-center border border-gray-200"
                    >
                        <View className="bg-amber-100 p-3 rounded-full mr-4">
                            <Feather name="upload-cloud" size={24} color="#d97706" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-gray-800 font-bold text-lg">अपलोड बाकी (Upload Queue)</Text>
                            <Text className="text-gray-500 text-sm">अपलोड न झालेले फोटो आणि माहिती पहा</Text>
                        </View>
                        <Feather name="chevron-right" size={24} color="#9ca3af" />
                    </Pressable>
                </View>

                {/* Logout Button */}
                <View className="flex-1 justify-end mt-8">
                    <Pressable
                        onPress={handleLogout}
                        className="w-full bg-red-600 rounded-xl py-4 items-center shadow-md active:opacity-80"
                    >
                        <Text className="text-white font-semibold text-lg">Logout</Text>
                    </Pressable>
                </View>
            </View>
        </ScreenWrapper>
    );
};

export default ProfileTab;
