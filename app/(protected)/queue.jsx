import ScreenWrapper from "@/components/custom/screens/ScreenWrapper";
import { dbService } from "@/services/db";
import { syncOfflineData } from "@/services/sync";
import { useEffect, useState } from "react";
import { Alert, FlatList, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";

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
        await syncOfflineData(fetchQueue);
        setIsSyncing(false);
        fetchQueue();
    };

    const renderItem = ({ item }) => (
        <View className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-3">
            <Text className="font-bold text-lg text-blue-800">मालमत्ता क्र: {item.malmatta_number}</Text>
            <Text className="text-gray-600 mt-1">Dharak ID: {item.dharak_id}</Text>
            <Text className="text-gray-600">Status: <Text className="font-semibold">{item.status}</Text></Text>
            {item.error_message && (
                <Text className="text-red-500 mt-2 text-sm">Error: {item.error_message}</Text>
            )}
        </View>
    );

    return (
        <ScreenWrapper>
            <View className="p-4 flex-1">
                <View className="flex-row items-center justify-between mb-6">
                    <TouchableOpacity onPress={() => router.back()} className="bg-gray-200 px-4 py-2 rounded-md">
                        <Text className="font-bold">Back</Text>
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-center">Offline Queue</Text>
                    <TouchableOpacity 
                        onPress={handleSync}
                        disabled={isSyncing || queue.length === 0}
                        className={`${isSyncing || queue.length === 0 ? 'bg-indigo-300' : 'bg-indigo-600'} px-4 py-2 rounded-md`}
                    >
                        <Text className="text-white font-bold">{isSyncing ? "Syncing..." : "Sync All"}</Text>
                    </TouchableOpacity>
                </View>

                {queue.length === 0 ? (
                    <Text className="text-center text-gray-500 mt-10">No pending offline uploads.</Text>
                ) : (
                    <FlatList
                        data={queue}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderItem}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>
        </ScreenWrapper>
    );
}
