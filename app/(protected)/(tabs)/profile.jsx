import ScreenWrapper from "@/components/custom/screens/ScreenWrapper";
import { logout } from "@/redux/slices/userSlice";
import { useRouter, useFocusEffect } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Feather, Ionicons } from "@expo/vector-icons";
import React, { useCallback, useState } from "react";
import { dbService } from "@/services/db";
import { saveUserState } from "@/utils/storage";

const ProfileTab = () => {
    const router = useRouter();
    const dispatch = useDispatch();
    const user = useSelector((state) => state.user);
    const { serverUrl, isConnected } = useSelector((state) => state.connection);
    const gp = useSelector((state) => state.gp);
    
    const [counts, setCounts] = useState({ offline: 0, pending: 0 });

    useFocusEffect(
        useCallback(() => {
            const fetchCounts = async () => {
                try {
                    const offline = await dbService.getLocalDharaksCount(serverUrl);
                    const pending = await dbService.getPendingUploadsCount();
                    setCounts({ offline, pending });
                } catch (e) {
                    console.error("Failed to fetch counts:", e);
                }
            };
            fetchCounts();
        }, [serverUrl])
    );

    const handleLogout = async () => {
        dispatch(logout());
        await saveUserState(null);
        // Redirect to login screen
        router.replace("/auth/login");
    };

    const firstLetter = user?.username ? user.username.charAt(0).toUpperCase() : "U";

    return (
        <ScreenWrapper>
            <View className="flex-1 bg-slate-50 px-6 py-6 justify-between">
                <View>
                    {/* Top Header Card */}
                    <View className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 items-center mb-6">
                        {/* Avatar */}
                        <View className="w-20 h-20 bg-indigo-50 rounded-full items-center justify-center border-4 border-indigo-100 shadow-inner mb-4">
                            <Text className="text-3xl font-extrabold text-indigo-600">{firstLetter}</Text>
                        </View>

                        {/* User Title */}
                        <Text className="text-2xl font-bold text-slate-800 mb-1">
                            {user?.username || "वापरकर्ता"}
                        </Text>
                        
                        {/* Gram Panchayat Name */}
                        {gp?.grampanchayat_name && (
                            <Text className="text-base font-medium text-slate-500 mb-3 text-center">
                                🏫 {gp.grampanchayat_name}
                            </Text>
                        )}

                        {/* Mode Indicator Badge */}
                        <View className={`px-4 py-1.5 rounded-full flex-row items-center ${isConnected ? 'bg-emerald-50 border border-emerald-100' : 'bg-amber-50 border border-amber-100'}`}>
                            <View className={`w-2.5 h-2.5 rounded-full mr-2 ${isConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                            <Text className={`text-sm font-bold ${isConnected ? 'text-emerald-700' : 'text-amber-700'}`}>
                                {isConnected ? "ऑनलाईन मोड" : "ऑफलाईन मोड"}
                            </Text>
                        </View>
                    </View>

                    {/* Stats Grid */}
                    <View className="flex-row justify-between gap-4 mb-6">
                        {/* Offline data stat */}
                        <View className="flex-1 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm items-center">
                            <View className="bg-indigo-50 p-2.5 rounded-xl mb-2">
                                <Feather name="database" size={20} color="#4f46e5" />
                            </View>
                            <Text className="text-sm font-semibold text-slate-400 mb-1">स्थानिक मालमत्ता</Text>
                            <Text className="text-2xl font-extrabold text-slate-800">{counts.offline}</Text>
                        </View>

                        {/* Pending uploads stat */}
                        <View className="flex-1 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm items-center">
                            <View className={`p-2.5 rounded-xl mb-2 ${counts.pending > 0 ? 'bg-amber-50' : 'bg-slate-50'}`}>
                                <Feather name="upload-cloud" size={20} color={counts.pending > 0 ? '#d97706' : '#64748b'} />
                            </View>
                            <Text className="text-sm font-semibold text-slate-400 mb-1">प्रलंबित कामे</Text>
                            <Text className={`text-2xl font-extrabold ${counts.pending > 0 ? 'text-amber-600' : 'text-slate-800'}`}>{counts.pending}</Text>
                        </View>
                    </View>

                    {/* Options List */}
                    <View className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                        {/* Option 1: Offline Data */}
                        <Pressable
                            onPress={() => router.push("/offline-data")}
                            className="flex-row items-center justify-between p-4 border-b border-slate-100 active:bg-slate-100"
                        >
                            <View className="flex-row items-center flex-1 pr-2">
                                <View className="bg-indigo-50 p-3 rounded-2xl mr-4">
                                    <Ionicons name="folder-open-outline" size={22} color="#4f46e5" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-slate-800 font-bold text-lg mb-0.5">स्थानिक डेटा तपासा</Text>
                                    <Text className="text-slate-400 text-sm" numberOfLines={1}>मोबाईलमध्ये सेव्ह केलेला सर्व डेटा पहा</Text>
                                </View>
                            </View>
                            <Feather name="chevron-right" size={20} color="#94a3b8" />
                        </Pressable>

                        {/* Option 2: Upload Queue */}
                        <Pressable
                            onPress={() => router.push("/queue")}
                            className="flex-row items-center justify-between p-4 active:bg-slate-100"
                        >
                            <View className="flex-row items-center flex-1 pr-2">
                                <View className={`p-3 rounded-2xl mr-4 ${counts.pending > 0 ? 'bg-amber-50' : 'bg-slate-50'}`}>
                                    <Ionicons name="cloud-upload-outline" size={22} color={counts.pending > 0 ? '#d97706' : '#64748b'} />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-slate-800 font-bold text-lg mb-0.5">प्रलंबित कामे अपलोड करा</Text>
                                    <Text className="text-slate-400 text-sm" numberOfLines={1}>फोटो आणि माहिती सर्व्हरवर पाठवा</Text>
                                </View>
                            </View>
                            <Feather name="chevron-right" size={20} color="#94a3b8" />
                        </Pressable>
                    </View>
                </View>

                {/* Logout Button */}
                <View className="mb-4">
                    <Pressable
                        onPress={handleLogout}
                        className="w-full bg-red-50 border border-red-100 rounded-2xl py-4 items-center flex-row justify-center active:bg-red-100"
                    >
                        <Feather name="log-out" size={20} color="#dc2626" />
                        <Text className="text-red-600 font-bold text-lg ml-2">लॉगआउट (बाहेर पडा)</Text>
                    </Pressable>
                </View>
            </View>
        </ScreenWrapper>
    );
};

export default ProfileTab;
