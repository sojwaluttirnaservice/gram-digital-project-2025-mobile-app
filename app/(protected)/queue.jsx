import ScreenWrapper from "@/components/custom/screens/ScreenWrapper";
import { dbService } from "@/services/db";
import { syncOfflineData } from "@/services/sync";
import { useEffect, useState } from "react";
import { Alert, FlatList, Pressable, Text, ActivityIndicator, View } from "react-native";
import { useRouter, Stack } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";

export default function QueueScreen() {
    const [queue, setQueue] = useState([]);
    const [isSyncing, setIsSyncing] = useState(false);
    const router = useRouter();

    const fetchQueue = async () => {
        try {
            const data = await dbService.getPendingUploads();
            setQueue(data || []);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchQueue();
    }, []);

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            await syncOfflineData(fetchQueue);
            Alert.alert("यशस्वी", "सर्व प्रलंबित माहिती यशस्वीरित्या अपलोड झाली आहे!");
        } catch (e) {
            Alert.alert("त्रुटी", "माहिती अपलोड करण्यात अडचण आली. कृपया इंटरनेट तपासा.");
        } finally {
            setIsSyncing(false);
            fetchQueue();
        }
    };

    const renderItem = ({ item }) => {
        const isFailed = item.status === "failed";
        return (
            <View className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-3">
                <View className="flex-row justify-between items-start mb-2">
                    <View>
                        <Text className="font-extrabold text-base text-slate-800">
                            मालमत्ता क्रमांक: {item.malmatta_number}
                        </Text>
                        <Text className="text-slate-400 text-xs mt-0.5">
                            धारक आयडी: {item.dharak_id}
                        </Text>
                    </View>
                    
                    {/* Status Badge */}
                    <View className={`px-2.5 py-1 rounded-full flex-row items-center border ${
                        isFailed 
                            ? 'bg-rose-50 border-rose-100' 
                            : 'bg-amber-50 border-amber-100'
                    }`}>
                        <View className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            isFailed ? 'bg-rose-500' : 'bg-amber-500'
                        }`} />
                        <Text className={`text-2xs font-extrabold ${
                            isFailed ? 'text-rose-600' : 'text-amber-700'
                        }`}>
                            {isFailed ? "अपलोड अयशस्वी" : "अपलोड बाकी"}
                        </Text>
                    </View>
                </View>

                {item.error_message && (
                    <View className="bg-rose-50/50 border border-rose-100/50 p-3 rounded-xl mt-1">
                        <Text className="text-rose-600 text-xs font-semibold leading-4">
                            ⚠️ कारण: {item.error_message}
                        </Text>
                    </View>
                )}
            </View>
        );
    };

    return (
        <ScreenWrapper>
            <Stack.Screen options={{ headerShown: false }} />
            <View className="flex-1 bg-slate-50 justify-between">
                <View className="flex-1">
                    <View className="bg-white px-6 pt-6 pb-5 rounded-b-3xl border-b border-slate-100 flex-row items-center justify-between shadow-sm">
                        <Pressable 
                            onPress={() => router.back()} 
                            className="p-2.5 bg-slate-50 rounded-2xl active:bg-slate-100 border border-slate-100"
                        >
                            <Feather name="arrow-left" size={20} color="#475569" />
                        </Pressable>
                        <Text className="text-xl font-bold text-slate-800 flex-1 text-center mx-2">अपलोड बाकी यादी</Text>
                        <View className="w-10" />
                    </View>

                    <View className="flex-1 px-5 pt-4">
                        {queue.length === 0 ? (
                            <View className="flex-1 items-center justify-center px-6">
                                <View className="bg-emerald-50 p-6 rounded-full mb-4 border border-emerald-100">
                                    <Ionicons name="cloud-done-outline" size={48} color="#10b981" />
                                </View>
                                <Text className="text-slate-700 font-bold text-lg text-center mb-2">
                                    सर्व माहिती अपलोड झाली आहे!
                                </Text>
                                <Text className="text-slate-400 text-sm text-center leading-5">
                                    तुमच्याकडे सध्या कोणतीही माहिती किंवा फोटो अपलोड करायचे शिल्लक नाहीत.
                                </Text>
                            </View>
                        ) : (
                            <View className="flex-1">
                                {/* Sync Info Banner */}
                                <View className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl mb-4 flex-row items-center">
                                    <Ionicons name="information-circle-outline" size={22} color="#4f46e5" />
                                    <Text className="text-indigo-800 text-xs font-bold ml-2.5 flex-1 leading-4">
                                        तुमच्याकडे सर्व्हरवर अपलोड करण्यासाठी {queue.length} मालमत्तांची माहिती बाकी आहे. कृपया इंटरनेट चालू करून खालील बटण दाबा.
                                    </Text>
                                </View>

                                <FlatList
                                    data={queue}
                                    keyExtractor={(item) => item.id.toString()}
                                    renderItem={renderItem}
                                    contentContainerStyle={{ paddingBottom: 20 }}
                                    showsVerticalScrollIndicator={false}
                                />
                            </View>
                        )}
                    </View>
                </View>

                {/* Bottom Action Button */}
                {queue.length > 0 && (
                    <View className="p-5 bg-white border-t border-slate-100">
                        <Pressable
                            onPress={handleSync}
                            disabled={isSyncing}
                            className={`w-full py-4 rounded-2xl flex-row justify-center items-center ${
                                isSyncing ? 'bg-indigo-400' : 'bg-indigo-600 active:opacity-90 shadow-md shadow-indigo-600/20'
                            }`}
                        >
                            {isSyncing ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <Feather name="refresh-cw" size={18} color="white" />
                            )}
                            <Text className="text-white font-bold text-base ml-2">
                                {isSyncing ? "माहिती अपलोड होत आहे..." : "सर्व माहिती अपलोड करा"}
                            </Text>
                        </Pressable>
                    </View>
                )}
            </View>
        </ScreenWrapper>
    );
}
