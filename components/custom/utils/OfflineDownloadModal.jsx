import { dbService } from '@/services/db';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Text, TouchableOpacity, View } from 'react-native';

export default function OfflineDownloadModal({ isVisible, serverUrl, apiInstance, onComplete, onCancel }) {
    const [progress, setProgress] = useState(0);
    const [total, setTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [isDownloading, setIsDownloading] = useState(false);
    const [error, setError] = useState(null);
    const [existingCount, setExistingCount] = useState(0);

    useEffect(() => {
        if (isVisible && serverUrl) {
            dbService.getLocalDharaksCount(serverUrl).then(setExistingCount);
        }
    }, [isVisible, serverUrl]);

    const handleRedownload = async () => {
        await dbService.wipeOfflineData(serverUrl);
        setExistingCount(0);
        startDownload(1);
    };

    const startDownload = async (pageToStart = 1) => {
        setIsDownloading(true);
        setError(null);
        let page = pageToStart;
        let hasMore = true;
        const limit = 500;

        try {
            while (hasMore) {
                setCurrentPage(page);
                const res = await apiInstance.get(`/namuna/8/list/all?page=${page}&limit=${limit}`);
                // If it's an HTML string (e.g. 404 page) or success is not true, throw error!
                if (!res || typeof res === 'string' || res.success !== true) {
                    throw new Error(res?.message || "API returned an unexpected response. Are you on the correct network?");
                }
                const users = res.data?.f8Users || [];
                const pagination = res.data?.pagination;

                if (pagination) {
                    setTotal(pagination.total);
                    setProgress(Math.min(page * limit, pagination.total));
                }

                if (users.length > 0) {
                    await dbService.bulkInsertDharaks(serverUrl, users);
                }

                hasMore = pagination?.hasMore || false;
                
                if (hasMore) {
                    page++;
                } else {
                    onComplete();
                }
            }
        } catch (err) {
            console.error("Download failed:", err);
            setError("डेटा डाउनलोड होऊ शकला नाही. कृपया इंटरनेट तपासा आणि पुन्हा प्रयत्न करा.");
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <Modal visible={isVisible} transparent animationType="fade">
            <View className="flex-1 bg-black/50 justify-center items-center px-6">
                <View className="bg-white p-6 rounded-xl w-full shadow-lg">
                    <Text className="text-xl font-bold mb-4 text-center">ऑफलाईन डेटा डाउनलोड</Text>
                    
                    {isDownloading ? (
                        <View className="items-center py-4">
                            <ActivityIndicator size="large" color="#4F46E5" />
                            <Text className="mt-4 text-gray-700 font-medium">
                                डाउनलोड होत आहे... {progress} / {total || '?'}
                            </Text>
                            <Text className="text-xs text-gray-500 mt-2 text-center">
                                कृपया ॲप चालू ठेवा आणि स्क्रीन बंद होऊ देऊ नका.
                            </Text>
                        </View>
                    ) : error ? (
                        <View>
                            <Text className="text-red-500 text-center mb-6 font-medium">{error}</Text>
                            <TouchableOpacity 
                                onPress={() => startDownload(currentPage)}
                                className="bg-indigo-600 py-3 rounded-lg items-center mb-3"
                            >
                                <Text className="text-white font-bold text-base">पुन्हा प्रयत्न करा</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                onPress={onCancel}
                                className="bg-gray-200 py-3 rounded-lg items-center"
                            >
                                <Text className="text-gray-800 font-bold text-base">रद्द करा</Text>
                            </TouchableOpacity>
                        </View>
                    ) : existingCount > 0 ? (
                        <View>
                            <Text className="text-gray-600 text-center mb-6 leading-5">
                                या गावासाठी तुमची {existingCount} मालमत्ता मोबाईलमध्ये आधीपासून डाउनलोड आहे.
                            </Text>
                            <TouchableOpacity 
                                onPress={handleRedownload}
                                className="bg-red-500 py-3 rounded-lg items-center mb-3"
                            >
                                <Text className="text-white font-bold text-base">जुनी माहिती डिलीट करा आणि नवीन डाउनलोड करा</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                onPress={onComplete}
                                className="bg-indigo-600 py-3 rounded-lg items-center"
                            >
                                <Text className="text-white font-bold text-base">पुढे जा</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View>
                            <Text className="text-gray-600 text-center mb-6 leading-5">
                                तुम्हाला सर्व मालमत्ता मोबाईलमध्ये डाउनलोड करायच्या आहेत का? याने तुम्ही इंटरनेट नसतानाही माहिती बघू शकाल.
                            </Text>
                            <TouchableOpacity 
                                onPress={() => startDownload(1)}
                                className="bg-indigo-600 py-3 rounded-lg items-center mb-3"
                            >
                                <Text className="text-white font-bold text-base">डाउनलोड सुरू करा</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                onPress={onCancel}
                                className="bg-gray-100 border border-gray-300 py-3 rounded-lg items-center"
                            >
                                <Text className="text-gray-800 font-bold text-base">नंतर करू (Skip)</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
}
