import ScreenWrapper from "@/components/custom/screens/ScreenWrapper";
import { dbService } from "@/services/db";
import { Feather } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import OfflineDownloadModal from "@/components/custom/utils/OfflineDownloadModal";
import { useApi } from "@/hooks/custom/useApi";

export default function OfflineDataScreen() {
    const router = useRouter();
    const serverUrl = useSelector((state) => state.connection.serverUrl);
    const [dharaks, setDharaks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showDownloadModal, setShowDownloadModal] = useState(false);
    const { api } = useApi();

    const loadData = async () => {
        setIsLoading(true);
        const data = await dbService.getAllLocalDharaks(serverUrl, 1000, 0); // Load up to 1000 for preview
        setDharaks(data);
        setIsLoading(false);
    };

    useEffect(() => {
        loadData();
    }, [serverUrl]);

    const renderItem = ({ item }) => (
        <View className="bg-white p-4 rounded-xl shadow-sm mb-3 border border-gray-100 flex-row justify-between items-center">
            <View className="flex-1 pr-4">
                <Text className="text-gray-900 font-bold text-lg mb-1">{item.feu_ownerName}</Text>
                <Text className="text-gray-500 font-medium">मा. क्र. {item.feu_malmattaNo}</Text>
            </View>
            <View className="bg-green-100 p-2 rounded-full">
                <Feather name="check-circle" size={20} color="#16a34a" />
            </View>
        </View>
    );

    return (
        <ScreenWrapper>
            <Stack.Screen options={{ headerShown: false }} />
            <View className="flex-1 bg-gray-50">
                {/* Header */}
                <View className="bg-indigo-600 px-6 pt-12 pb-6 rounded-b-3xl shadow-lg flex-row items-center">
                    <Pressable onPress={() => router.back()} className="mr-4 p-2">
                        <Feather name="arrow-left" size={24} color="white" />
                    </Pressable>
                    <Text className="text-2xl font-bold text-white flex-1">ऑफलाईन डाउनलोड डेटा</Text>
                    <Pressable onPress={() => setShowDownloadModal(true)} className="p-2 bg-indigo-500 rounded-lg">
                        <Feather name="download-cloud" size={20} color="white" />
                    </Pressable>
                </View>

                {/* List */}
                <View className="flex-1 px-4 pt-6">
                    {isLoading ? (
                        <Text className="text-center text-gray-500 mt-10 text-lg">माहिती येत आहे...</Text>
                    ) : dharaks.length === 0 ? (
                        <View className="items-center justify-center mt-20">
                            <Feather name="database" size={64} color="#d1d5db" />
                            <Text className="text-gray-400 text-lg mt-4 font-medium text-center">
                                इथे काहीही नाही. कृपया आधी माहिती डाउनलोड करा.
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={dharaks}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={renderItem}
                            contentContainerStyle={{ paddingBottom: 40 }}
                            showsVerticalScrollIndicator={false}
                        />
                    )}
                </View>

                {/* Download Modal */}
                <OfflineDownloadModal
                    isVisible={showDownloadModal}
                    serverUrl={serverUrl}
                    apiInstance={api}
                    onComplete={() => {
                        setShowDownloadModal(false);
                        loadData(); // Refresh list after download
                    }}
                    onCancel={() => {
                        setShowDownloadModal(false);
                    }}
                />
            </View>
        </ScreenWrapper>
    );
}
