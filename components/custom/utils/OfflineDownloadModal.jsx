import { dbService } from '@/services/db';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

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
        try {
            setError(null);
            await dbService.wipeOfflineData(serverUrl);
            setExistingCount(0);
            startDownload(1);
        } catch (e) {
            console.error("Wipe failed:", e);
            setError("जुनी माहिती डिलीट करता आली नाही. कृपया पुन्हा प्रयत्न करा.");
        }
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
                if (!res || typeof res === 'string' || res.success !== true) {
                    throw new Error(res?.message || "API returned an unexpected response.");
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
                <View className="bg-white p-6 rounded-2xl w-full shadow-lg relative">
                    {/* Top Right Close Button (hidden during download) */}
                    {!isDownloading && (
                        <TouchableOpacity 
                            onPress={onCancel}
                            className="absolute right-4 top-4 p-1.5 bg-slate-50 border border-slate-100 rounded-full active:bg-slate-100 z-10"
                        >
                            <Feather name="x" size={18} color="#64748b" />
                        </TouchableOpacity>
                    )}

                    <Text className="text-xl font-bold mb-4 text-center text-slate-800 pr-6">ऑफलाईन डेटा डाउनलोड</Text>
                    
                    {isDownloading ? (
                        <View className="items-center py-4">
                            <ActivityIndicator size="large" color="#4F46E5" />
                            <Text className="mt-4 text-gray-700 font-bold text-base">
                                डाउनलोड होत आहे... {progress} / {total || '?'}
                            </Text>
                            <Text className="text-xs text-gray-500 mt-2 text-center leading-4">
                                कृपया ॲप चालू ठेवा आणि स्क्रीन बंद होऊ देऊ नका.
                            </Text>
                        </View>
                    ) : error ? (
                        <View>
                            <Text className="text-red-500 text-center mb-6 font-semibold leading-5">{error}</Text>
                            <TouchableOpacity 
                                onPress={() => startDownload(currentPage)}
                                className="bg-indigo-600 py-3.5 rounded-xl items-center mb-3 active:opacity-90"
                            >
                                <Text className="text-white font-bold text-base">पुन्हा प्रयत्न करा</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                onPress={onCancel}
                                className="bg-slate-100 border border-slate-200 py-3.5 rounded-xl items-center active:bg-slate-200"
                            >
                                <Text className="text-slate-700 font-bold text-base">बंद करा (Close)</Text>
                            </TouchableOpacity>
                        </View>
                    ) : existingCount > 0 ? (
                        <View>
                            <Text className="text-slate-600 text-center mb-6 leading-5 font-medium">
                                या गावासाठी तुमची {existingCount} मालमत्ता मोबाईलमध्ये आधीपासून डाउनलोड आहे.
                            </Text>
                            <TouchableOpacity 
                                onPress={handleRedownload}
                                className="bg-red-500 py-3.5 rounded-xl items-center mb-3 active:opacity-90"
                            >
                                <Text className="text-white font-bold text-base">जुनी माहिती डिलीट करा व नवीन डाउनलोड करा</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                onPress={onComplete}
                                className="bg-indigo-600 py-3.5 rounded-xl items-center mb-3 active:opacity-90"
                            >
                                <Text className="text-white font-bold text-base">पुढे जा (माहिती न बदलता)</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                onPress={onCancel}
                                className="bg-slate-100 border border-slate-200 py-3.5 rounded-xl items-center active:bg-slate-200"
                            >
                                <Text className="text-slate-700 font-bold text-base">बंद करा (Close)</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View>
                            <Text className="text-slate-600 text-center mb-6 leading-5 font-medium">
                                तुम्हाला सर्व मालमत्ता मोबाईलमध्ये डाउनलोड करायच्या आहेत का? याने तुम्ही इंटरनेट नसतानाही काम करू शकाल.
                            </Text>
                            <TouchableOpacity 
                                onPress={() => startDownload(1)}
                                className="bg-indigo-600 py-3.5 rounded-xl items-center mb-3 active:opacity-90"
                            >
                                <Text className="text-white font-bold text-base">डाउनलोड सुरू करा</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                onPress={onCancel}
                                className="bg-slate-100 border border-slate-200 py-3.5 rounded-xl items-center active:bg-slate-200"
                            >
                                <Text className="text-slate-700 font-bold text-base">नंतर करू (Skip)</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
}
